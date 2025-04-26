const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
require('dotenv').config();


// Conexão com MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// Teste de conexão
(async () => {
    try {
        await db.query('SELECT 1');
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar no banco de dados:', err.message);
    }
})();


// Listar todos os produtos
app.get('/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

//buscar produto pelo filtro nome
app.get('/products/search', async (req, res) => {

    try {
        const { name } = req.query;
        
        if (!name) {
            return res.status(400).json({ error: 'Parâmetro "name" é obrigatório' });
        }

        //concatenando o nome diretamente no SQL - Vunerável - concatenado
        //url: http://localhost:8081/products/search?name=' OR '1'='1
        const sql = `SELECT * FROM products WHERE name LIKE '%${name}%'`;
        const [result] = await db.query(sql);

        //corrigido - parametrizado
        //url: http://localhost:8081/products/search?name=camiseta
        //const [result] = await db.query('SELECT * FROM products WHERE name LIKE ?', [`%${name}%`]);

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});


//Buscar produto por ID
app.get('/products/:id', async (req, res) => {
    try {
        const [result] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});


// Adicionar um produto
app.post('/products/add', async (req, res) => {
    try {
        const { name, price, description, image } = req.body;

        await db.query(
            'INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)',
            [name, price, description, image]
        );

        res.status(201).json({ message: 'Produto adicionado com sucesso!' });
    } catch (err) {
        console.error('Erro ao adicionar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// Atualizar um produto
app.put('/products/update/:id', async (req, res) => {
    try {
        const { name, price, description, image } = req.body;
        const [result] = await db.query(
            'UPDATE products SET name = ?, price = ?, description = ?, image = ? WHERE id = ?',
            [name, price, description, image, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Deletar um produto
app.delete('/products/delete/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ message: 'Produto deletado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

// Inicialização do servidor
app.listen(8081, () => {
    console.log('Servidor rodando na URL http://localhost:8081');
});