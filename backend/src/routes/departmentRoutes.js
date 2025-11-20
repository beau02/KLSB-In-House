const express = require('express');
const router = express.Router();

// Simple departments endpoint - returns a small list of departments.
// This is intentionally lightweight (no DB) so it works immediately.
const departments = [
  { id: 'engineering', name: 'Engineering Department' },
  { id: 'design', name: 'Design Department' },
  { id: 'finance', name: 'Finance Department' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'qa', name: 'Quality Assurance' }
];

// GET /api/departments
router.get('/', (req, res) => {
  res.json({ departments });
});

module.exports = router;
