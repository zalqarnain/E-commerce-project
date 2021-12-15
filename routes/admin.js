const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {format} = require('../middleware');


//write functionalaties


const sql = require('mysql');
const conn = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projectdb'
});


requireRights = (request,response,next)=> {
    if (!request.session.adminId) {
        console.log("User is not admin");
        response.redirect('/admin/login');
        return;
    }
    next();
};

router.get('/createadmin', (request,response)=> {
    response.render('newAdmin');
})

router.post('/createadmin', async(request,response)=> {
    const newAdmin = request.body;
    newAdmin.pwd = await bcrypt.hash(newAdmin.pwd, 12);
    conn.query('insert into admins set ?', newAdmin, (error,results)=> {
        if (error) throw error;
        else {
            request.session.adminId = newAdmin.adminId;
            response.send('welcome new admin')
        }
    })
})

router.get('/login', (request,response)=> {
    response.render('adminLogin');
})

router.post('/login', (request,response)=> {
    let admin = request.body;
    let result = false;
    conn.query('select * from admins where username = ?', [admin.username], async(error,results)=> {
        if (error) throw error;
        if (results.length>=1) {
            result = await bcrypt.compare(admin.pwd, results[0].pwd);
        } else {
            response.send('Admin not found');
            return;
        }
        if (result) {
            admin = results[0];
            request.session.adminId = admin.adminId;
            response.send('Welcome Admin');
            return;  
        }  else {
            console.log('Wrong Password');
            response.redirect('/admin/login');
            return;
        }
    })
})

router.get('/logout', (request,response)=> {
    delete request.session.adminId;
    response.redirect('/login');
})

//form to add perfumes 
router.get('/add', requireRights, (request,response)=> {
    response.render('new');
});

//add a new perfume
router.post('/new', requireRights, async(request,response)=> {
    let newPerfume = request.body;
    newPerfume = format(newPerfume);
    
    conn.query('insert into products set ?', newPerfume, (error, results) => {
        if (error)
            throw error;
        else {
            request.flash('success', 'Product Successfully Created');
            response.redirect('/products');
            return;
        }
    })
});

router.put('/products/:id', requireRights, async(request,response)=> {
    const {id} = request.params;
    let newPerfume = request.body;
    newPerfume = format(newPerfume);

    conn.query('update products set productName=?, product_image=?, description=?, quantity=?, price=?, cat_id=? where productId=?',
        [newPerfume.productName, newPerfume.product_image, newPerfume.description, newPerfume.quantity, newPerfume.price, newPerfume.cat_id, id],
        (error, results) => {
            if (error)
                throw error;
            else {
                request.flash('success', 'Product Successfully updated');
                response.redirect(`/products/${id}`);
                return;
            }
        })
})

router.get('/products/:id/update', requireRights, async(request,response)=> {
    const {id} = request.params;
    conn.query('select * from products where productId = ?', [id], (error, results) => {
        if (error)
            throw error;
        else {
            const perfume = results[0];
            response.render('update', { perfume });
            return;
        }
    })
})

//to delete an individual perfume 
router.delete('/products/:id', requireRights, async(request,response)=> {
    const {id} = request.params;
    conn.query('update orders set productId=null where productID=?',[id]);
    conn.query('delete from products where productID=?',[id], (error,results)=> {
        if (error) throw error;
        else {
            request.flash('success', 'Product deleted successfully');
            response.redirect('/products');
            return;
        }
    });
    
});


module.exports = router;
