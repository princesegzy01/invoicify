const assert = require('assert');
const expect = require('chai').expect
const request = require('supertest');
const app = require('../app')

const fs = require("fs");


describe('Unit testing route', function() {

    it('should return 200 status code', () => {
      return request(app)
        .get('/')
        .then(function(response: any){
            assert.equal(response.status, 200)
        })
    });

    it('should return 404 status code', () => {
        return request(app)
          .post('/')
          .then(function(response: any){
              assert.equal(response.status, 404)
          })
    });

    it('should return 404 status code', () => {
        return request(app)
          .get('/upload-csv')
          .then(function(response: any){
              assert.equal(response.status, 404)
          })
      });
  

    it('should return 500 status code', () => {
        return request(app)
          .post('/upload-csv')
          .then(function(response: any){
              assert.equal(response.status, 500);
          })
    });

    it('When good file is uploaded ', function() {
        return request(app).post('/upload-csv')
            .attach('csvdata', fs.readFileSync('test/data/good.csv'), 'good.csv')
            .then(function(response: any){
                assert.equal(response.status, 200);
            });
    });

    it('When a bad file is uploaded', function() {
        return request(app).post('/upload-csv')
            .attach('csvdata', fs.readFileSync('test/data/bad.csv'), 'bad.csv')
            .then(function(response: any){
                assert.equal(response.status, 200);
            });
    });
    

});