const express = require('express');
const router = express.Router();
const bookmarkCtrl = require('../controllers/bookmark.controller');
const historyCtrl = require('../controllers/history.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Bookmarks
const bmRouter = express.Router();
bmRouter.use(authenticate);
bmRouter.get('/', bookmarkCtrl.getBookmarks);
bmRouter.post('/', bookmarkCtrl.addBookmark);
bmRouter.delete('/:destinationId', bookmarkCtrl.removeBookmark);

// History
const histRouter = express.Router();
histRouter.use(authenticate);
histRouter.get('/', historyCtrl.getHistory);
histRouter.post('/', historyCtrl.addHistory);

module.exports = { bookmarkRouter: bmRouter, historyRouter: histRouter };
