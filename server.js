
const express = require('express');
const { format } = require('path');
require('dotenv').config()
const app = express();
const redis = require('ioredis'),
client = new redis({
    port: 6380,
    host: "127.0.0.1"
});
const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'redis-caching',
    password: process.env.PASSWORD,
    port: 5432,
});


app.get('/', async (req, res) => {
    console.log('hyome')
    client.on('error', (err) => console.log('Redis Client Error', err));
    res.json('Home')
    
})

app.get('/connect', async (req, res) => {
    console.log('connect')

    res.json('connect')
    
})

app.get('/set/:chave/:id', async (req, res) => {
    console.log('set')
    
    console.time('contingRedisTime')
    let chave = await client.get(req.params.chave);

    if(chave != null) {
        console.log('valor encontrado')
        console.log(chave)
        console.timeEnd('contingRedisTime')
        res.json('chave já armazenada no redis')
    }
    await client.set(req.params.chave, req.params.id, "EX", 10);

    console.log('a')
    resp = await pool.query('insert into "user" (name, number) values ($1, $2)', [req.params.chave, req.params.id])
    
    console.timeEnd('contingRedisTime')
    res.json('inserido')
})

app.get('/get/:chave', async (req, res) => {
    
    console.log('get')

    console.time('contingRedisTime')
    let chave = await client.get(req.params.chave);

    if(chave != null) {
        console.log('valor encontrado')
        console.timeEnd('contingRedisTime')
        res.json(chave)
    }

    let resp
    
    for(let i = 0;i < 100000; i++){
        // resp = await client.get(req.params.id);
        resp = await pool.query(`select number from "user" where name = $1`, [req.params.chave])
    }
    console.timeEnd('contingRedisTime')
    
    res.json(resp)
})

app.listen(8080, (req, res) => {
    console.log('Listenning to port 8080')
})


