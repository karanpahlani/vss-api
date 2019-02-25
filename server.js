const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');


const app = express();

app.use(bodyParser.json());
app.use(cors());

const database = {
    users: [
        {
            id:'123',
            name: 'Jhon',
            email: 'jhon@gmail.com',
            password: 'cookies',
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
        res.json('success');
    } else{
        res.status(400).json('error logging in');
    }
})

app.post('/register', (req,res) =>{
    const {email, name ,password } = req.body;
    bcrypt.hash(password, null, null, function(err,hash) {
            console.log(hash);
    });

    bcrypt.compare('apples', '$2a$10$0fJdraeTa1/S8O0fc/Wzt.Mf9hRFhkFOC1XZsN4yROl9B1VnY/jhG', function(err, res) {
        console.log('first guess:',res)
    });
    bcrypt.compare('banannas' , '$2a$10$0fJdraeTa1/S8O0fc/Wzt.Mf9hRFhkFOC1XZsN4yROl9B1VnY/jhG', function(err, res) {
        console.log('sec guess:', res)
    });

    database.users.push({
        id:'125',
        name: name,
        email: email,
        password: password,
        entries: 0,
        joined: new Date()

    })
    res.json(database.users[database.users.length - 1]);
})




app.listen(3000, ()=>{
    console.log('app is running on port  3000');
})