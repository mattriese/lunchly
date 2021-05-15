"use strict";

const { query } = require("../db");
/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");
const { NotFoundError } = require("../expressError")

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
  /* Displays fullname of customer */
  fullName() {
    return this.firstName + " " + this.lastName;
  }

  /** search function to find customer id with first and last name ... return an array of customer objects*/
  static async searchFullName(firstName, lastName) {
    console.log("fname, lname", firstName, lastName)
    const customer = await db.query(
      `SELECT id,
        first_name AS "firstName",
        last_name  AS "lastName",
        phone,
        notes
       FROM customers
       WHERE first_name ILIKE $1 OR
             last_name ILIKE $2`,
      [`%${firstName}%`, `%${lastName}%`],
    );

    console.log("customerId after query = ", customer);
    if (customer.rows.length === 0) throw new NotFoundError("customer name not found")
    // no search records found vs n... just return from the backend that we found zero.
    return customer.rows.map(c => new Customer(c));
  }


  /*Searches for a customer when only one name is given */
  static async searchOneName(name) {

    const customer = await db.query(
      `SELECT id,
      first_name AS "firstName",
      last_name  AS "lastName",
      phone,
      notes
       FROM customers
       WHERE first_name ILIKE $1 OR
             last_name ILIKE $1`,
      [`%${name}%`],
    );

    if (customer.rows.length === 0) throw new NotFoundError("customer name not found");
    return customer.rows.map(c => new Customer(c));
  }

}

module.exports = Customer;
