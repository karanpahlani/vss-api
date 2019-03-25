const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user: 'karan',
        password: '',
        database: 'VSS'
    }
});

db.select('*').from('passenger').then(data => {
        console.log(data);
    });

const app = express();

app.use(bodyParser.json());
app.use(cors());

const database = {
    users: [
        {
            id:'123',
            name: 'Jhon',
            email: 'jhon',
            password: 'co',
            entries: 0,
            joined: new Date()
        },
        {
            id:"456",
            name: "sally",
            email: 'sally@gmail.com',
            password:'bananas',
            entries: 0,
            joined: new Date()

        }

    ]
}

app.get('/', (req, res) =>{
    res.send(database.users)

})

app.get('/profile/:id', (req, res)=>{
    const { id } = req.params;
    let found = false;
    database.users.forEach(user => {
        if(user.id === id){
            found = true;
            return res.json(user);
        }
    })
    if (!found){
        res.status(400).json('not found');
    }
})


app.post('/signin', (req,res) =>{
    if(req.body.email === database.users[0].email &&
        req.body.password === database.users[0].password){
        res.json(database.users[0]);
    } else{
        res.status(400).json('error logging in');
    }
})

app.post('/register', (req,res) =>{
    const {email, name ,address, phone } = req.body;

    db('passenger')
        .returning('*')
        .insert({
            email: email,
            name: name,
            address: address,
            phone: phone,
            joined: new Date()
    })
        .then(user =>{
            res.json(user[0]);
    })
        .catch(err => res.status(400).json('unable to register'))
})




app.listen(3000, ()=>{
    console.log('app is running on port  3000');
})