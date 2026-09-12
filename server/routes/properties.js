const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Cloudinary setup for image uploads (works on Vercel)
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'allenshores/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }],
    public_id: (req, file) => `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadFields = upload.array('images', 10);

// Protected beach IDs - only their respective owners can manage these
const OWNER_BEACH_IDS = [2, 7, 11];

// Valid property types
const VALID_TYPES = ['cottage', 'room'];

// Table names per type
const TABLES = {
  cottage: { main: 'cottages', images: 'cottage_images', fk: 'cottage_id' },
  room: { main: 'rooms', images: 'room_images', fk: 'room_id' }
};

// Helper: validate type
const validateType = (req, res, next) => {
  const type = req.params.type;
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Invalid property type. Use "cottage" or "room".' });
  }
  next();
};

// Helper: determine effective beach_id and verify access for write operations
// - Owners can only manage their own beach (req.beachId from JWT)
// - Super Admin can manage any non-owner-protected beach (beach_id from body/params)
const getManagedBeachId = (req, isCreate = false) => {
  // Owner case
  if (req.owner && req.beachId) {
    return req.beachId;
  }
  // Super Admin case
  if (req.admin && req.admin.role === 'admin') {
    const beachId = isCreate
      ? parseInt(req.body.beach_id)
      : parseInt(req.body.beach_id || req.params.beach_id || req.query.beach_id);
    return beachId;
  }
  return null;
};

// Middleware: require auth + verify beach access for write operations
const requireWriteAccess = (isCreate = false) => async (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const beachId = getManagedBeachId(req, isCreate);
  if (!beachId || isNaN(beachId)) {
    return res.status(403).json({ message: 'Beach ID is required' });
  }

  // Super Admin cannot modify owner-protected beaches
  if (req.admin.role === 'admin' && OWNER_BEACH_IDS.includes(beachId)) {
    return res.status(403).json({
      message: 'This beach is managed by its beach owner. Super Admin cannot modify owner-managed beaches.'
    });
  }

  // Verify beach exists
  const { rows } = await db.query('SELECT id FROM beaches WHERE id = $1', [beachId]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Beach not found' });
  }

  req.managedBeachId = beachId;
  next();
};

// ═══════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ═══════════════════════════════════════════════════════════

// @route   GET /api/properties/:type/beach/:beachId
// @desc    Get all cottages/rooms for a beach (with images)
// @access  Public
router.get('/:type/beach/:beachId', validateType, async (req, res) => {
  try {
    const { type, beachId } = req.params;
    const tables = TABLES[type];

    const { rows } = await db.query(
      `SELECT c.*, COALESCE(
        (SELECT json_agg(
          json_build_object('id', ci.id, 'image_path', ci.image_path, 'is_primary', ci.is_primary)
        ) FROM ${tables.images} ci WHERE ci.${tables.fk} = c.id),
        '[]'::json
      ) as images
      FROM ${tables.main} c
      WHERE c.beach_id = $1 AND c.is_available = TRUE
      ORDER BY c.created_at ASC`,
      [beachId]
    );

    res.json(rows);
  } catch (err) {
    console.error(`Get ${req.params.type}s error:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:type/:id
// @desc    Get single cottage/room with images
// @access  Public
router.get('/:type/:id', validateType, async (req, res) => {
  try {
    const { type, id } = req.params;
    const tables = TABLES[type];

    const { rows } = await db.query(
      `SELECT c.*,
        COALESCE(
          (SELECT json_agg(
            json_build_object('id', ci.id, 'image_path', ci.image_path, 'is_primary', ci.is_primary)
          ) FROM ${tables.images} ci WHERE ci.${tables.fk} = c.id),
          '[]'::json
        ) as images,
        b.name as beach_name
      FROM ${tables.main} c
      LEFT JOIN beaches b ON c.beach_id = b.id
      WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: `${type} not found` });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(`Get ${req.params.type} error:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN/OWNER ROUTES (auth required)
// ═══════════════════════════════════════════════════════════

// @route   POST /api/properties/:type
// @desc    Create new cottage/room with images
// @access  Private (Admin or Owner)
router.post('/:type', authMiddleware, requireWriteAccess(true), (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { type } = req.params;
    const tables = TABLES[type];
    const beachId = req.managedBeachId;

    const { name, description, price, capacity, quantity, is_available } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO ${tables.main}
        (beach_id, name, description, price, capacity, quantity, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        beachId,
        name,
        description || '',
        price ? parseFloat(price) : 0,
        capacity ? parseInt(capacity) : 2,
        quantity ? parseInt(quantity) : 1,
        is_available === false ? false : true
      ]
    );

    const propId = rows[0].id;

    // Insert images
    let primaryImage = null;
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const isPrimary = i === 0;
        const imagePath = file.path || file.secure_url || file.url;
        if (isPrimary) primaryImage = imagePath;

        await db.query(
          `INSERT INTO ${tables.images} (${tables.fk}, image_path, is_primary) VALUES ($1, $2, $3)`,
          [propId, imagePath, isPrimary]
        );
      }
    }

    res.status(201).json({ id: propId, message: `${type} created successfully` });
  } catch (err) {
    console.error(`Create ${req.params.type} error:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:type/manage/:beachId
// @desc    Get all cottages/rooms for management (includes unavailable)
// @access  Private (Admin or Owner)
router.get('/:type/manage/:beachId', authMiddleware, requireWriteAccess(false), async (req, res) => {
  try {
    const { type } = req.params;
    const beachId = req.managedBeachId;
    const tables = TABLES[type];

    const { rows } = await db.query(
      `SELECT c.*, COALESCE(
        (SELECT json_agg(
          json_build_object('id', ci.id, 'image_path', ci.image_path, 'is_primary', ci.is_primary)
        ) FROM ${tables.images} ci WHERE ci.${tables.fk} = c.id),
        '[]'::json
      ) as images
      FROM ${tables.main} c
      WHERE c.beach_id = $1
      ORDER BY c.created_at ASC`,
      [beachId]
    );

    res.json(rows);
  } catch (err) {
    console.error(`Get ${req.params.type}s for management error:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/properties/:type/:id
// @desc    Update cottage/room details + add new images
// @access  Private (Admin or Owner)
router.put('/:type/:id', authMiddleware, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { type, id } = req.params;
    const tables = TABLES[type];

    // Verify ownership/access
    const { rows: existing } = await db.query(`SELECT * FROM ${tables.main} WHERE id = $1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: `${type} not found` });
    }

    const propBeachId = existing[0].beach_id;
    const beachId = getManagedBeachId(req, false);
    if (!beachId || beachId !== propBeachId) {
      return res.status(403).json({ message: 'Not authorized to modify this property' });
    }
    if (req.admin.role === 'admin' && OWNER_BEACH_IDS.includes(propBeachId)) {
      return res.status(403).json({ message: 'Cannot modify owner-managed beach properties' });
    }

    const { name, description, price, capacity, quantity, is_available, deletedImages, primaryImageId } = req.body;

    await db.query(
      `UPDATE ${tables.main} SET
        name = $1, description = $2, price = $3,
        capacity = $4, quantity = $5, is_available = $6
      WHERE id = $7`,
      [
        name, description || '',
        price ? parseFloat(price) : 0,
        capacity ? parseInt(capacity) : 2,
        quantity ? parseInt(quantity) : 1,
        is_available === 'false' || is_available === false ? false : true,
        id
      ]
    );

    // Delete removed images
    if (deletedImages) {
      let idsToDelete = [];
      try {
        idsToDelete = Array.isArray(deletedImages)
          ? deletedImages.map(i => parseInt(i))
          : JSON.parse(deletedImages).map(i => parseInt(i));
      } catch (e) {
        idsToDelete = [];
      }

      if (idsToDelete.length > 0) {
        const { rows: imagesToDelete } = await db.query(
          `SELECT * FROM ${tables.images} WHERE id = ANY($1::int[]) AND ${tables.fk} = $2`,
          [idsToDelete, id]
        );

        for (const img of imagesToDelete) {
          if (img.image_path && img.image_path.includes('cloudinary')) {
            try {
              const urlParts = img.image_path.split('/');
              const uploadIndex = urlParts.findIndex(p => p === 'upload');
              if (uploadIndex !== -1) {
                const publicIdParts = urlParts.slice(uploadIndex + 2);
                const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
                await cloudinary.uploader.destroy(publicId);
              }
            } catch (err) {
              console.warn('Could not delete from Cloudinary:', img.image_path, err.message);
            }
          }
        }

        await db.query(
          `DELETE FROM ${tables.images} WHERE id = ANY($1::int[]) AND ${tables.fk} = $2`,
          [idsToDelete, id]
        );
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const { rows: existingImages } = await db.query(
        `SELECT * FROM ${tables.images} WHERE ${tables.fk} = $1`,
        [id]
      );

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const isPrimary = existingImages.length === 0 && i === 0;
        const imagePath = file.path || file.secure_url || file.url;

        await db.query(
          `INSERT INTO ${tables.images} (${tables.fk}, image_path, is_primary) VALUES ($1, $2, $3)`,
          [id, imagePath, isPrimary]
        );
      }
    }

    // Set primary image
    if (primaryImageId) {
      await db.query(
        `UPDATE ${tables.images} SET is_primary = FALSE WHERE ${tables.fk} = $1`,
        [id]
      );
      await db.query(
        `UPDATE ${tables.images} SET is_primary = TRUE WHERE id = $1 AND ${tables.fk} = $2`,
        [primaryImageId, id]
      );
    }

    res.json({ message: `${type} updated successfully` });
  } catch (err) {
    console.error(`Update ${req.params.type} error:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/properties/:type/:id
// @desc    Delete cottage/room and all images
// @access  Private (Admin or Owner)
router.delete('/:type/:id', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const tables = TABLES[type];

    const { rows: existing } = await db.query(`SELECT * FROM ${tables.main} WHERE id = $1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: `${type} not found` });
    }

    const propBeachId = existing[0].beach_id;
    const beachId = getManagedBeachId(req, false);
    if (!beachId || beachId !== propBeachId) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }
    if (req.admin.role === 'admin' && OWNER_BEACH_IDS.includes(propBeachId)) {
      return res.status(403).json({ message: 'Cannot delete owner-managed beach properties' });
    }

    // Get images to delete from Cloudinary
    const { rows: images } = await db.query(
      `SELECT image_path FROM ${tables.images} WHERE ${tables.fk} = $1`,
      [id]
    );

    for (const image of images) {
      if (image.image_path && image.image_path.includes('cloudinary')) {
        try {
          const urlParts = image.image_path.split('/');
          const uploadIndex = urlParts.findIndex(p => p === 'upload');
          if (uploadIndex !== -1) {
            const publicIdParts = urlParts.slice(uploadIndex + 2);
            const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.warn('Could not delete from Cloudinary:', image.image_path, err.message);
        }
      }
    }

    await db.query(`DELETE FROM ${tables.main} WHERE id = $1`, [id]);

    res.json({ message: `${type} deleted successfully` });
  } catch (err) {
    console.error(`Delete ${req.params.type} error:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/properties/:type/:id/images/:imageId
// @desc    Delete a single property image
// @access  Private (Admin or Owner)
router.delete('/:type/:id/images/:imageId', authMiddleware, async (req, res) => {
  try {
    const { type, id, imageId } = req.params;
    const tables = TABLES[type];

    const { rows: existing } = await db.query(`SELECT * FROM ${tables.main} WHERE id = $1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: `${type} not found` });
    }

    const propBeachId = existing[0].beach_id;
    const beachId = getManagedBeachId(req, false);
    if (!beachId || beachId !== propBeachId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.admin.role === 'admin' && OWNER_BEACH_IDS.includes(propBeachId)) {
      return res.status(403).json({ message: 'Cannot modify owner-managed beach properties' });
    }

    const { rows: imageRows } = await db.query(
      `SELECT * FROM ${tables.images} WHERE id = $1 AND ${tables.fk} = $2`,
      [imageId, id]
    );

    if (imageRows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = imageRows[0];
    if (image.image_path && image.image_path.includes('cloudinary')) {
      try {
        const urlParts = image.image_path.split('/');
        const uploadIndex = urlParts.findIndex(p => p === 'upload');
        if (uploadIndex !== -1) {
          const publicIdParts = urlParts.slice(uploadIndex + 2);
          const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.warn('Could not delete from Cloudinary:', image.image_path, err.message);
      }
    }

    await db.query(`DELETE FROM ${tables.images} WHERE id = $1`, [imageId]);

    // If deleted image was primary, promote another
    if (image.is_primary) {
      const { rows: nextRows } = await db.query(
        `SELECT id FROM ${tables.images} WHERE ${tables.fk} = $1 ORDER BY created_at ASC LIMIT 1`,
        [id]
      );
      if (nextRows.length > 0) {
        await db.query(
          `UPDATE ${tables.images} SET is_primary = TRUE WHERE id = $1`,
          [nextRows[0].id]
        );
      }
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Delete property image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
