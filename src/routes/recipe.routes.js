import { Router } from 'express';

import { createPost, updateImage, updateDetails } from '../controllers/recipe.controller.js';
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/create-post').post(
    verifyJWT,
    upload.single('recipeImage'), // Adjust 'profilePic' to the actual field name in the form
    createPost
);

router.route('/update-image').post(
    upload.single('updatedImage'),
    updateImage
)
router.route('/update-details').post(
    updateDetails
)

export default router;