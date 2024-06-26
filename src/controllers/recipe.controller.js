import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Recipe } from "../models/recipe.models.js";
import { User } from "../models/user.models.js"; // Make sure to import User model
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPost = asyncHandler(async (req, res) => {
    const { title, description, ingredient, steps, category, userId } = req.body;

    if (
        [title, description, ingredient, steps, category, userId].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // const user = await User.findById(req.user?._id);
    // if (!user) {
    //     throw new ApiError(404, "User not found");
    // }

    const recipeImagePath = req.file?.path;

    if (!recipeImagePath) {
        throw new ApiError(400, "Recipe image file is required");
    }

    const recipeImage = await uploadOnCloudinary(recipeImagePath);

    if (!recipeImage) {
        throw new ApiError(400, "Error uploading recipe image");
    }

    const recipe = await Recipe.create({
        recipeImage: recipeImage.url, // Assuming the uploadOnCloudinary function returns an object with a url property
        title,
        description,
        ingredient,
        steps,
        userId,
        category
    });

    const createdRecipe = await Recipe.findById(recipe._id).select(
        "-description -ingredient -steps -category"
    );

    if (!createdRecipe) {
        throw new ApiError(500, "Something went wrong while creating the recipe");
    }

    return res.status(201).json(
        new ApiResponse(201, createdRecipe, "Recipe created successfully")
    );
});

const updateImage = asyncHandler(async (req, res) => {
    const { recipe_id } = req.body;

    // Check if the recipe_id is provided
    if (!recipe_id) {
        throw new ApiError(400, "Recipe ID is required");
    }

    // Find the recipe by ID
    let recipe = await Recipe.findById(recipe_id);
    if (!recipe) {
        throw new ApiError(404, "Recipe not found");
    }

    // Check if the updated image file exists
    const updatedImagePath = req.file?.path;
    if (!updatedImagePath) {
        throw new ApiError(400, "Recipe image file is required");
    }

    // Upload the updated image to Cloudinary
    const updatedImage = await uploadOnCloudinary(updatedImagePath);
    if (!updatedImage) {
        throw new ApiError(400, "Error uploading recipe image");
    }

    try {
        // Update the recipe's image URL with the new one
        recipe.recipeImage = updatedImage.url;
        await recipe.save();

        // If you have additional logic to update the table, do it here

        // Respond with success message
        return res.status(200).json(
            new ApiResponse(200, updatedImage, "Image updated successfully!")
        );
    } catch (error) {
        // If any error occurs during the update process, handle it
        throw new ApiError(500, "Error updating recipe image");
    }
});



const updateDetails = asyncHandler(async (req, res) => {

    const { title, description, ingredient, steps, recipe_id } = req.body;

    if (!recipe_id) {
        throw new ApiError(400, "Recipe ID is required");
    }

    // Find the recipe by ID
    let recipe = await Recipe.findById(recipe_id);
    if (!recipe) {
        throw new ApiError(404, "Recipe not found");
    }


    try {
        // Update the recipe's image URL with the new one
        if (title != '') {
            recipe.title = title;

        }

        if (description != '') {
            recipe.description = description;
        }
        if (ingredient != '') {
            recipe.ingredient = ingredient;

        }
        if (steps != '') {
            recipe.steps = steps;

        }
        await recipe.save();

        // If you have additional logic to update the table, do it here

        // Respond with success message
        return res.status(200).json(
            new ApiResponse(200, recipe, "Image updated successfully!")
        );
    } catch (error) {
        // If any error occurs during the update process, handle it
        throw new ApiError(500, "Error updating details");
    }

});


const getAllPost = asyncHandler(async (req, res) => {
    try {
        const recipes = await Recipe.find();
        return res.status(200).json(
            new ApiResponse(200, recipes, "Recipes fetched successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching recipes");
    }
});

const getUserPost = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    try {
        const userRecipes = await Recipe.find({ userId });

        return res.status(200).json(
            new ApiResponse(200, userRecipes, "User recipes fetched successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching user recipes");
    }
});

const viewRecipe = asyncHandler(async (req, res) => {
    const { recipeId } = req.body;

    if (!recipeId) {
        return res.status(400).json(
            new ApiError(400, "Recipe Id not Found")
        );
    }

    try {
        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json(
                new ApiError(404, "Recipe not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, recipe, "Recipe data fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching recipe data:", error); // Log the error
        return res.status(500).json(
            new ApiError(500, "Error fetching data")
        );
    }

});



const getSavedPosts = asyncHandler(async (req, res) => {
    try {
        // Assuming req.user.id contains the ID of the logged-in user
        const userId = req.user._id;

        // Find the user by ID and populate the savedRecipe field
        const user = await User.findById(userId).populate('savedRecipe').exec();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with the populated saved recipes
        res.json(user.savedRecipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const saveRecipe = asyncHandler(async (req, res) => {
    const { recipeId, userId } = req.body;
    console.log("recieve request");

    if (!recipeId) {
        console.log("recipe id not found");
        return res.status(400).json(new ApiError(400, "Recipe ID is required"));
    }

    // const userId = req.user._id;

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            console.log("no user found");
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        // Check if the recipe is already saved
        if (user.savedRecipe.includes(recipeId)) {
            console.log("Recipe is already saved");
            return res.status(400).json(new ApiError(400, "Recipe already saved"));
        }

        // Add the recipe to the savedRecipe array
        user.savedRecipe.push(recipeId);

        // Save the user document
        await user.save();
        console.log("recipe saved successfully");
        return res.status(200).json(

            new ApiResponse(200, user.savedRecipe, "Recipe saved successfully")
        );
    } catch (error) {
        console.error("Error saving recipe:", error);
        return res.status(500).json(new ApiError(500, "Error saving recipe"));
    }
});

const unsaveRecipe = asyncHandler(async (req, res) => {
    const { recipeId, userId } = req.body;
    console.log("Received request to unsave recipe");

    if (!recipeId) {
        console.log("Recipe ID not found");
        return res.status(400).json(new ApiError(400, "Recipe ID is required"));
    }

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            console.log("No user found");
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        // Check if the recipe is saved
        if (!user.savedRecipe.includes(recipeId)) {
            console.log("Recipe is not saved");
            return res.status(400).json(new ApiError(400, "Recipe is not saved"));
        }

        user.savedRecipe = user.savedRecipe.filter(id => id.toString() !== recipeId.toString());

        // Save the user document
        await user.save();
        console.log("Recipe unsaved successfully");
        return res.status(200).json(
            new ApiResponse(200, user.savedRecipe, "Recipe unsaved successfully")
        );
    } catch (error) {
        console.error("Error unsaving recipe:", error);
        return res.status(500).json(new ApiError(500, "Error unsaving recipe", [error.message]));
    }
});

const deletePost = asyncHandler(async (req, res) => {
    const { userId, recipeId } = req.body;
    console.log("Received request to delete recipe");

    try {
        // Check if both userId and recipeId are provided
        if (!userId || !recipeId) {
            console.log("Both User ID and Recipe ID are required");
            throw new ApiError(400, "Both User ID and Recipe ID are required");
        }

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found");
            throw new ApiError(404, "User not found");
        }

        // Find the recipe by ID
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            console.log("Recipe not found");
            throw new ApiError(404, "Recipe not found");
        }

        // Check if the user owns the recipe
        if (recipe.userId.toString() !== userId.toString()) {
            console.log("User is not authorized to delete this recipe");
            throw new ApiError(403, "User is not authorized to delete this recipe");
        }

        // Delete the recipe
        await Recipe.findByIdAndDelete(recipeId);
        console.log("Removed recipe successfully");

        return res.status(200).json(
            new ApiResponse(200, {}, "Recipe deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting recipe:", error);
        return res.status(500).json(new ApiError(500, "Error deleting recipe"));
    }
});

const searchRecipes = asyncHandler(async (req, res) => {
    const { query } = req.query;

    // Check if the query parameter is provided
    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    try {
        // Search for recipes that match the provided query
        const recipes = await Recipe.find({
            $or: [
                { title: { $regex: query, $options: "i" } }, // Case-insensitive title search
                { category: { $regex: query, $options: "i" } }, // Case-insensitive category search
            ],
        });

        // Return the search results
        res.status(200).json({
            status: "success",
            message: "Recipes found successfully",
            recipes,
        });
    } catch (error) {
        // Handle errors
        throw new ApiError(500, "Error searching for recipes");
    }
});


export { createPost, updateImage, updateDetails, getAllPost, getUserPost, viewRecipe, getSavedPosts, saveRecipe, unsaveRecipe, deletePost, searchRecipes };
