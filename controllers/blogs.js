const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const middleware = require('../utils/middleware');

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog
  .find({})
  .populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.post("/", middleware.userExtractor, async (request, response) => {
  const body = request.body;
  const user = request.user
  if (!user) {
    console.log('error finding user')
    return response
      .status(400)
      .json({ error: "No users found in the database" });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
    comment: []
  });
  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1 });
  
  response.status(201).json(populatedBlog);
});

blogsRouter.post("/:id/comments", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  const comment = request.body.comment
  if (!blog || !comment) {
    return response.status(400).json({ error: 'Invalid blog ID or comment' });
  }
  blog.comments = blog.comments.concat(comment)
  await blog.save()
  response.status(201).json(blog)
})

blogsRouter.delete("/:id", middleware.userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (!blog) {
    return response.status(404).end();
  }
  const user = request.user
  if (!user || !blog.user){
    return response.status(401).json({ error: 'only creator of the blog can delete it' })
  }
  if (blog.user.toString() !== user._id.toString()) {
    return response.status(401).json({ error: 'only creator of the blog can delete it' })
  } 
  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
    runValidators: true,
    context: "query",
  });
  if (updatedBlog) {
    response.json(updatedBlog);
  } else {
    response.status(404).end();
  }
});

blogsRouter.delete("/", async (request, response) => {
  await Blog.deleteMany({});
  response.status(204).end();
});

module.exports = blogsRouter;
