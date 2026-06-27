const { z } = require('zod');

// Utility to validate and throw with proper status
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return res.status(422).json({ success: false, message: 'Validation failed', errors });
    }
    req.body = result.data;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return res.status(422).json({ success: false, message: 'Invalid query parameters', errors });
    }
    req.query = result.data;
    next();
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password required'),
});

const tripSchema = z.object({
    title: z.string().min(1, 'Title required').max(200),
    description: z.string().optional(),
    startDate: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
    endDate: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
    budgetEstimated: z.number().min(0).optional(),
    status: z.enum(['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
});

const reviewSchema = z.object({
    destinationId: z.string().min(1, 'Destination ID required'),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(200).optional(),
    body: z.string().min(10, 'Review must be at least 10 characters'),
    visitedAt: z.string().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
});

const destinationQuerySchema = paginationSchema.extend({
    state: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
});

const nearbyQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(100).max(100000).default(10000),
    type: z.string().optional(),
});

module.exports = {
    validate,
    validateQuery,
    registerSchema,
    loginSchema,
    tripSchema,
    reviewSchema,
    paginationSchema,
    destinationQuerySchema,
    nearbyQuerySchema,
};
