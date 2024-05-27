const { test, after, beforeEach } = require("node:test");
const mongoose = require("mongoose");
const supertest = require("supertest");
const assert = require("node:assert");
const helper = require("./test_helper");
const app = require("../app");

const api = supertest(app);

const User = require("../models/user");

test('invalid users are not created', async () =>{
    const invalidUser = {
        username: 'yes',
        name: 'khang',
        password:'12'
    }
    await api
        .post('/api/users')
        .send(invalidUser)
        .expect(400)
    
    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, 2)
    
})

after(async () => {
    await mongoose.connection.close();
  });