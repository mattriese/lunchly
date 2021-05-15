"use strict";

/** Routes for Lunchly */

const express = require("express");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  const customers = await Customer.all();
  return res.render("customer_list.html", { customers });
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});


/** Route that makes a get request from the search bar to /?query_string GET
 * pull out the name from query string assuming first word is first name and 2nd word
 * is last name, ignoring anything else
 * and make sql query on that name, returning customer_id
 * redirect to that customer detail page.
 *
 * search for a customer */
router.get("/search/", async function (req, res, next) {
  console.log("req.query = ", req.query);

  const { name } = req.query;
  console.log("name= ", name);
  const [firstName, lastName] = name.split(" ");
  //const firstName = name.split(" ")[0];
  //const lastName = name.split(" ")[1];

  let customers;
  try {
    if (!lastName) {
      customers = await Customer.searchOneName(name);
    } else {
      customers = await Customer.searchFullName(firstName, lastName)
    }
    return res.render("customer_list.html", { customers });
  }
  catch(err) {
    return res.render("error.html", {err});
  }
});


/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  const customerId = req.params.id;
  console.log("req.params.id = ", req.params.id)
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    numGuests,
    startAt,
    notes,
  });
  console.log("reservation= ", reservation);
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});



module.exports = router;
