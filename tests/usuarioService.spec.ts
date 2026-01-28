import { describe, it, } from 'node:test';
import app from '../src/app';
import request from 'supertest'


describe('Teste de Rota getOne',()=>{
    it('Deve retornar um usuário',async (done)=>{
        const response = await request(app).get('/usuarios/1')
        expect(response.status).toBe(200)
        expect(response.body.sucess).toBe(true)
    })
    it('Não deve retornar um usuario',async (done)=>{
        const response = await request(app).get('/usuarios/1')
        expect(response.status).toBe(404)
        expect(response.body.sucess).toBe(false)
    })
})