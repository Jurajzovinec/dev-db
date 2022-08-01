#!/usr/bin/env zx

const process = require("process")
const mysql = require("mysql")

class DumpProcess {
  constructor() {
    /**
     * Entry point data, those data drives selection of all dumped data
     */
    this.userIds = ["'id1'", "'id2'"].join(",")
    this.databaseHost = process.argv[3] || "127.0.0.1"
    this.databasePort = process.argv[4] || "3306"
    this.databaseName = process.argv[5] || "demo"
    this.databaseUser = process.argv[6] || "root"
    this.databasePassword = process.argv[7] || "root"
  }

  async initDump() {
    this.mysqlDumpBinPath = await this.getDumpBinPath()
    this.mysqlConnection = await this.getMysqlConnection()
    this.mysqlDumpBinFlags = this.getMysqlDumpFlags()
    this.tableOneIds = await this.getTableOneIds()
    this.tableTwoIds = await this.getTableTwoIds()
    this.tableThreeIds = await this.getTableThreeIds()
    this.tableThreeSymbols = await this.getTableThreeSymbols()
    this.tableFourIds = await this.getTableFourIds()
    await this.stopDbConnection()
    this.dumpTables = await this.getDumpTables()
  }

  async getDumpBinPath() {
    return (await $`which mysqldump`).stdout.trim()
  }

  async getMysqlConnection() {
    return new Promise((resolve, reject) => {
      const connection = mysql.createConnection({
        host: this.databaseHost,
        user: this.databaseUser,
        password: this.databasePassword,
        database: this.databaseName,
      })
      connection.connect((err) => {
        if (err) {
          reject(err)
        }
        resolve(connection)
      })
    })
  }

  getMysqlDumpFlags() {
    return [
      "--host=" + this.databaseHost,
      "--port=" + this.databasePort,
      "--user=" + this.databaseUser,
      "--password=" + `"${this.databasePassword}"`,
      this.databaseName,
      "--column-statistics=0",
      "--lock-tables=false",
    ]
  }

  getTableOrderNumber(indexNumber) {
    for (let i = 0; i <= 3; i++) {
      if (indexNumber.length === 3) {
        return indexNumber
      }
      indexNumber = indexNumber.replace(/^/, "0")
    }
  }

  async getQuery(query) {
    return new Promise((resolve, reject) => {
      this.mysqlConnection.query(query, (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      })
    })
  }

  async getTableOneIds() {
    const query = `select id from tableOne WHERE tableOne.userId in (${this.userIds})`
    const queryRes = await this.getQuery(query)
    return queryRes.map((portfolio) => `'${portfolio.id}'`)
  }

  async getTableTwoIds() {
    const query = `select id from tableTwo WHERE tableTwo.tableOneId IN (${this.tableOneIds})`
    const queryRes = await this.getQuery(query)
    return queryRes.map((stock) => `'${stock.stockId}'`)
  }

  async getTableThreeIds() {
    const query = `select id from tableThree WHERE userId IN (${this.userIds})`
    const queryRes = await this.getQuery(query)
    return queryRes.map((stockList) => `'${stockList.id}'`)
  }

  async getTableThreeSymbols() {
    const query = `select symbol from tableThree WHERE tableThree.id IN (${this.tableTwoIds})`
    const queryRes = await this.getQuery(query)
    return queryRes.map((stock) => `'${stock.symbol}'`)
  }

  async getTableFourIds() {
    const query = `select id from tableFour WHERE id != -1`
    const queryRes = await this.getQuery(query)
    return queryRes.map((etfStat) => `'${etfStat.id}'`)
  }

  async getDumpTables() {
    return [
      {
        name: "tableOne",
        condition: `_computed.id IN (${this.tableTwoIds})`,
      },
      {
        name: "tableTwo",
        condition: `_demo.stockId IN (${this.tableTwoIds})`,
      },
      {
        name: "tableThree",
        condition: `_earnings.stockId IN (${this.tableTwoIds})`,
      },
      {
        name: "tableFour",
        condition: `_etfStats.id != -1`,
      },
    ]
  }

  async sleep(time) {
    return new Promise((res) => setTimeout(res, time))
  }

  async stopDbConnection() {
    await this.mysqlConnection.end()
  }

  async dumpData() {
    const dumpCommands = []

    for (let i = 0; i < this.dumpTables.length; i++) {
      const table = this.dumpTables[i]
      const cmd =
        `${this.mysqlDumpBinPath} ` +
        `${this.mysqlDumpBinFlags.join(" ")} --where="${table.condition}" ` +
        `${table.name} > dump/${this.getTableOrderNumber(`${i}`)}-${
          table.name
        }.sql`
      dumpCommands.push(cmd)
    }

    for await (const cmd of dumpCommands) {
      await this.sleep(1000)
      await $([cmd])
    }
  }
}

const dumpProcess = new DumpProcess()
await dumpProcess.initDump()
await dumpProcess.dumpData()
