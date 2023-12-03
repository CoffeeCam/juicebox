const express = require('express');
const postsRouter = express.Router();

const { requireUser } = require('./utils');

const { 
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
  deletePost, // Import the deletePost function
} = require('../db');

postsRouter.get('/', async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      if (post.active || (req.user && post.author.id === req.user.id)) {
        return true;
      }
      return false;
    });
  
    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content = "", tags } = req.body;

  const postData = {
    authorId: req.user.id,
    title,
    content,
    tags: tags ? tags.trim().split(/\s+/) : [], // Handle tags
  };

  try {
    const post = await createPost(postData);

    if (post) {
      res.send(post);
    } else {
      next({
        name: 'PostCreationError',
        message: 'There was an error creating your post. Please try again.'
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/); // Handle tags
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost });
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;

  try {
    const postToDelete = await getPostById(postId);

    if (!postToDelete) {
      return next({
        name: 'PostNotFoundError',
        message: 'Post not found',
      });
    }

    if (postToDelete.author.id !== req.user.id) {
      return next({
        name: 'UnauthorizedUserError',
        message: 'You cannot delete a post that is not yours',
      });
    }

    await deletePost(postId);

    res.send({ message: 'Post deleted successfully' });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = postsRouter;
