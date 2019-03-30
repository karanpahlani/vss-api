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



app.get('/', (req, res) =>{
    res.send(database.users)

})

app.get('/profile/:id', (req, res)=>{
    const { id } = req.params;

    db.select('*').from('passenger').where({userid: id})
    .then(user => {
        if(user.length) {
            res.json(user[0])
        }else{
            res.status(400).json('Not Found')
        }
    })

})


app.post('/signin', (req,res) =>{
    db.select('email', 'hash').from('login')
        .where('email', '=' ,req.body.email)
        .then(data=> {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            console.log(isValid)
            console.log(data[0])
            if(isValid){
               return db.select('*').from('passenger')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        console.log(user);
                        var result = {
                            loggedIn : true,
                            userData: user[0]
                        }
                        res.json(result);
                    })
                    .catch(err => res.status(400).json('unable to get user'))
            } else {
                var result = {
                    loggedIn: false,
                    reason: 'wrong credentials'
                }
                res.status(400).json(result);
            }
        })
        .catch(err => res.status(400).json({
            loggedIn: false,
            reason: 'wrong credentials'
        }))
})



app.post('/register', (req,res) =>{
    const {email, name ,address, password, phone } = req.body;
    const hash = bcrypt.hashSync(password);

        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
                .into('login')
                .returning('email')
                .then(loginEmail => {
                    return trx('passenger')
                        .returning('*')
                        .insert({
                            email: loginEmail[0],
                            name: name,
                            address: address,
                            phone: phone,
                            joined: new Date()
                        })
                        .then(user =>{
                            res.json(user[0]);
                        })
                })
                .then(trx.commit)
                .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('unable to register'))
})




app.listen(3000, ()=>{
    console.log('app is running on port  3000');
})