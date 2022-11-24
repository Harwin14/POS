const express = require('express');
const { isLoggedIn } = require('../helpers/util')
const { currencyFormatter } = require('../helpers/util')
const router = express.Router();
const moment = require('moment');
const { query } = require('express');

module.exports = (db) => {
  router.get('/', isLoggedIn, async (req, res, next) => {
    try {
      res.render('sales/list', {
        success: req.flash('success'),
        error: req.flash('error'),
        currentPage: 'POS - Sales',
        user: req.session.user,
        currencyFormatter,
        moment
      })
    } catch (e) {
      console.log('error awal',e)
      res.send(e);
    }
  });
  router.get('/datatable', async (req, res) => {
    let params = []

    if (req.query.search.value) {
      params.push(`invoice ilike '%${req.query.search.value}%'`)
    }
    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from sales${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    //const data = await db.query(`select * from sales${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const data = await db.query(`SELECT s.*, c.* FROM sales as s LEFT JOIN customers as c ON s.customer = c.customerid${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const response = {
      "draw": Number(req.query.draw),
      "recordsTotal": total.rows[0].total,
      "recordsFiltered": total.rows[0].total,
      "data": data.rows
    }
    res.json(response)
  })


  router.get('/create', isLoggedIn, async (req, res, next) => {
    try {
      const { userid, customerid } = req.session.user
      const { rows } = await db.query('INSERT INTO sales(totalsum, customer, operator) VALUES (0, $1, $2) returning *', [customerid,userid])
     // console.log(rows)

      res.redirect(`/sales/show/${rows[0].invoice}`)

    } catch (error) {
      console.log('error create', error)
    }
  });

  router.get('/show/:invoice', isLoggedIn, async (req, res, next) => {
    try {
      const { invoice } = req.params
      const sales = await db.query('SELECT s.*, c.* FROM sales as s LEFT JOIN customers as c ON s.customer = c.customerid where invoice = $1', [invoice])
      const  users  = await db.query('SELECT * FROM users ORDER BY userid')
      const { rows: goods } = await db.query('SELECT barcode, name FROM goods ORDER BY barcode')
      const { rows } = await db.query('SELECT * FROM customers ORDER BY customerid')
     //console.log(sales, sales.rows[0])
     
     res.render('sales/form', {
        currentPage: 'POS - Sales',
        user: req.session.user,
        sales: sales.rows[0],
        goods,
        users,
        customer: rows,
        moment,
    })
    } catch (e) {
      console.log('error show', e)
      res.send(e);
    }
  });

  router.post('/show/:invoice', isLoggedIn, async (req, res) => {
    try {
      const { invoice } = req.params
      const { totalsum, customer } = req.body
      await db.query('UPDATE sales SET totalsum = $1, customer = $2 WHERE invoice = $3', [totalsum, customer, invoice])

      req.flash('success', 'Transaction Success!')
      res.redirect('/sales')
    } catch (error) {
      console.log('error post show',error)
      req.flash('error', 'Transaction Fail!')
      return res.redirect('/sales')
    }
  })


  router.get('/goods/:barcode', isLoggedIn, async (req, res) => {
    try {
      const { barcode } = req.params
      const { rows } = await db.query('SELECT * FROM goods WHERE barcode = $1', [barcode]);
     
      res.json(rows[0])
    } catch (err) {
      res.send(err)
    }
  })

  router.post('/additem', isLoggedIn, async (req, res) => {
    try {
      const { invoice, itemcode, quantity } = req.body
      await db.query('INSERT INTO salesitems (invoice, itemcode, quantity)VALUES ($1, $2, $3) returning *', [invoice, itemcode, quantity]);
      const { rows } = await db.query('SELECT * FROM sales WHERE invoice = $1', [invoice])
    
      res.json(rows[0])
    } catch (err) {
      console.log(err)
      res.send(err)
    }
  })

  router.get('/details/:invoice', isLoggedIn, async (req, res, next) => {
    try {
      const { invoice } = req.params
      const { rows: data } = await db.query('SELECT salesitems.*, goods.name FROM salesitems LEFT JOIN goods ON salesitems.itemcode = goods.barcode WHERE salesitems.invoice = $1 ORDER BY salesitems.id', [invoice])

      res.json(data)
    } catch (err) {
      console.log(err)
    }
  });

 
  router.get('/deleteitems/:id', isLoggedIn, async (req, res, next) => {
    try {
      const { id } = req.params
      const { rows: data } = await db.query('DELETE FROM salesitems WHERE id = $1 returning *', [id])
      
      req.flash('success', 'Transaction deleted successfully') 
      res.redirect(`/sales/show/${data[0].invoice}`)
    } catch (err) {
      req.flash('error', 'Please, Edit and Delete items first ')

      console.log(err)
    }
  });

  router.get('/delete/:invoice', isLoggedIn, async (req, res, next) => {
    try {
      const { invoice } = req.params
      await db.query('DELETE FROM sales WHERE invoice = $1', [invoice])
    
      req.flash('success', 'Transaction deleted successfully')
      res.redirect('/sales');
    } catch (err) {
      req.flash('error', 'Please, Edit and Delete items first ')
      return res.redirect('/sales')
    }
  });
  return router;
}     