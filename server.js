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


app.post('/addride',(req,res) =>{

    db.select('van_capacity').from('vans')
        .where('assigned_route', '=' , req.body.route)
        .then( capacity=>{
            console.log(capacity)
            if(capacity[0].van_capacity >= 0) {
                db.from('vans').where({assigned_route: req.body.route}).update({van_capacity: knex.raw('?? - 1', ['van_capacity'])})
                    .then(van => {

                        db.from('passenger').where({userid: req.body.passid}).update({
                            activeride: req.body.route,
                            user_balance: knex.raw('?? + 5', ['user_balance'])
                        })
                            .then(user => {
                                db.select('*').from('passenger').where({userid: req.body.passid})
                                    .then(user => {
                                        console.log(user);
                                        db.select('routename').from('route')
                                            .where('routeid', '=', user[0].activeride)
                                            .then(routename => {
                                                var result = {
                                                    loggedIn: true,
                                                    userData: user[0],
                                                    type: 'passenger',
                                                    routename: routename[0].routename
                                                }
                                                res.json(result);
                                            })
                                    })
                            })

                    })

            }
            else {

                db.select('*').from('passenger').where({userid: req.body.passid})
                    .then(user => {
                        console.log(user);
                        db.select('routename').from('route')
                            .where('routeid', '=', user[0].activeride)
                            .then(routename => {
                                var result = {
                                    loggedIn: true,
                                    userData: user[0],
                                    type: 'passenger',
                                    routename: routename[0].routename
                                }
                                res.status(400).json(result);
                            })
                    })
            }
        })







})


app.get('/routes', (req, res) =>{
    db.select('*').from('route')
        .then(data=>{
            res.json(data)
        })


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
    db.select('email', 'hash', 'type').from('login')
        .where('email', '=' ,req.body.email)
        .then(data=> {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            console.log(isValid);
            console.log(data[0]);
            if(isValid){
                if(data[0].type === "passenger") {
                    console.log("trying to login as passenger")
                    db.select('*').from('passenger')
                        .where('email', '=', req.body.email)
                        .then(user => {
                            console.log(user);
                           if(user[0].activeride === null)
                           {
                               var result = {
                                   loggedIn: true,
                                   userData: user[0],
                                   type: 'passenger'
                               }
                               res.json(result);
                           }
                           else {
                               db.select('routename').from('route')
                                   .where('routeid', '=', user[0].activeride)
                                   .then(routename => {
                                       var result = {
                                           loggedIn: true,
                                           userData: user[0],
                                           type: 'passenger',
                                           routename: routename[0].routename
                                       }


                                       res.json(result);
                                   })
                           }


                        })
                        .catch(err => res.status(400).json('unable to get user'))

                } else if (data[0].type === "driver"){
                    console.log("trying to login as driver")
                    return db.select('*').from('driver')
                        .where('email', '=', req.body.email)
                        .then(user => {
                            console.log(user);
                            var result = {
                                loggedIn: true,
                                userData: user[0],
                                type: 'driver'
                            };
                            res.json(result);
                        })
                        .catch(err => res.status(400).json('unable to get user'))

                } else if (data[0].type === "admin"){
                    return db.select('*').from('admin')
                        .where('email', '=', req.body.email)
                        .then(user => {
                            console.log(user);
                            var result = {
                                loggedIn: true,
                                userData: user[0],
                                type: 'admin'
                            };
                            res.json(result);
                        })
                        .catch(err => res.status(400).json('unable to get user'))

                }


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
    const {email, name ,address, password, phone, type } = req.body;
    const hash = bcrypt.hashSync(password);


    if(req.body.type === "passenger") {
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email,
                type: type
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
                        .then(user => {

                            var result = {
                                loggedIn: true,
                                userData: user[0],
                                type: 'passenger'
                            };
                            res.json(result);
                        })
                })
                .then(trx.commit)
                .catch(trx.rollback)
        })
            .catch(err => res.status(400).json('unable to register'))
    }
    else if(req.body.type === "driver"){
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email,
                type: type
            })
                .into('login')
                .returning('email')
                .then(loginEmail => {

                    return trx('driver')
                        .returning('*')
                        .insert({
                            email: loginEmail[0],
                            name: name,
                            address: address,
                            phone: phone,
                            joined: new Date()
                        })
                        .then(user => {

                            var result = {
                                loggedIn: true,
                                userData: user[0],
                                type: 'driver'
                            };
                            res.json(result);
                        })
                })
                .then(trx.commit)
                .catch(trx.rollback)
        })
            .catch(err => res.status(400).json('unable to register'))

    }
})

app.get('/availableVans', (req,res) =>{

    db.select('*').from('vans').where({available: true})
        .then(data=>{
            res.json(data)
        })

})

app.get('/stops', (req,res) => {

    db.select('*').from('stop')
        .then(data=>{
            res.json(data)
        })

})

app.post('/createRoute', (req,res) =>{
    const { route } = req.body;

    console.log("attempting to create route: " + route);
    db.transaction(trx => {
        trx.insert({
            routename: route
        })
            .into('route')


            .then(trx.commit)
            .catch(trx.rollback)
    })
        .catch(err => res.status(400).json('unable to add route'))


})

app.post('/createStop', (req,res) =>{
    const { stop } = req.body;

    console.log("attempting to create stop: " + stop);
    db.transaction(trx => {
        trx.insert({
            name: stop
        })
            .into('stop')

            .then(user => {

                const result = {
                    loggedIn: true,
                    userData: user[0],
                    type: 'admin'
                };
                res.json(result);
            })

            .then(trx.commit)
            .catch(trx.rollback);
        console.log(stop + " added to stops table")
    })
        .catch(err => res.status(400).json('unable to add stop'))
});

app.post('/addVan', (req,res) =>{
    const { name, van_capacity } = req.body;

    console.log("attempting to add van: " + name + ", Capacity: " + van_capacity);
    db.transaction(trx => {
        trx.insert({
            name: name,
            van_capacity: van_capacity
        })
            .into('vans')

            .then(user => {

                const result = {
                    loggedIn: true,
                    userData: user[0],
                    type: 'admin'
                };
                res.json(result);
            })

            .then(trx.commit)
            .catch(trx.rollback);
        console.log(name + ", Capacity: " + van_capacity + ", added to vans table")
    })
        .catch(err => res.status(400).json('unable to add van'))


})




app.listen(3000, ()=>{
    console.log('app is running on port  3000');
})
