const { test, after, beforeEach } = require("node:test");
const mongoose = require("mongoose");
const supertest = require("supertest");
const assert = require("node:assert");
const helper = require("./test_helper");
const app = require("../app");

const api = supertest(app);

const Blog = require("../models/blog");

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

const loginAndGetToken = async () => {
  const user = {
    username: "james",
    password: "1234",
  };

  const response = await api.post("/api/login").send(user);
  return response.body.token;
};
test("blogs are returned as json", async () => {
  const token = await loginAndGetToken();
  await api
    .get("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);
});
test("application returns the correct amount of blogs", async () => {
  const token = await loginAndGetToken();
  const response = await api
    .get("/api/blogs")
    .set("Authorization", `Bearer ${token}`);
  assert.strictEqual(response.body.length, helper.initialBlogs.length);
});

test("unique identifier is id", async () => {
  const token = await loginAndGetToken();
  const response = await api
    .get("/api/blogs")
    .set("Authorization", `Bearer ${token}`);
  const blogs = response.body;
  blogs.forEach((blog) => {
    assert.ok(blog.id, "blog has an id property");
    assert.strictEqual(
      blog._id,
      undefined,
      "Blog does not have an _id property"
    );
  });
});
test("adding a blog fails if token is not provided", async () => {
  const token = null
  const newBlog = {
    title: "hello",
    url: "asdasdasd",
  };
  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(401)
    .expect("Content-Type", /application\/json/);

  const response = await helper.blogsInDb();
  assert.strictEqual(response.length, helper.initialBlogs.length);
});

test("a valid blog can be added", async () => {
  const token = await loginAndGetToken();
  const newBlog = {
    title: "hello",
    url: "asdasdasd",
  };
  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const response = await helper.blogsInDb();

  const contents = response.map((r) => r.title);
  assert.strictEqual(response.length, helper.initialBlogs.length + 1);
  assert(contents.includes("hello"));
});

test("default like is zero", async () => {
  const token = await loginAndGetToken();
  const newBlog = {
    title: "hello",
    url: "asdasdasd",
  };
  const response = await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);
  const createdBlog = response.body;
  assert.strictEqual(createdBlog.likes, 0);
});

test("blog without title or url will not be added", async () => {
  const token = await loginAndGetToken();

  const invalidBlog = {
    likes: 10,
  };
  await api.post("/api/blogs").set("Authorization", `Bearer ${token}`)
  .send(invalidBlog).expect(400);

  const response = await api.get("/api/blogs").set("Authorization", `Bearer ${token}`);
  assert.strictEqual(response.body.length, helper.initialBlogs.length);
});
test("a blog can be deleted", async () => {
  const token = await loginAndGetToken();
  const blogsAtStart = await helper.blogsInDb();
  const blogToDelete = blogsAtStart[0];

  await api.delete(`/api/blogs/${blogToDelete.id}`).set("Authorization", `Bearer ${token}`)
  .expect(204)

  const blogsAtEnd = await helper.blogsInDb();
  const contents = blogsAtEnd.map((r) => r.title);
  assert(!contents.includes(blogToDelete.title));
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
});

test("a blog can be updated", async () => {
  const token = await loginAndGetToken();
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];

  const updatedBlog = {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 4,
  };

  await api.put(`/api/blogs/${blogToUpdate.id}`).set("Authorization", `Bearer ${token}`).send(updatedBlog).expect(200);

  const blogsAtEnd = await helper.blogsInDb();
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  assert.strictEqual(blogsAtEnd[0].likes, 4);
});

after(async () => {
  await mongoose.connection.close();
});
