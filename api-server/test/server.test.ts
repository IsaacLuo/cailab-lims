import server from '../src/server'
import request from 'supertest'

afterEach(()=>{
  // server.close();
});

function sum(a,b) {
  return a+b;
}
test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
})