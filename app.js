const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
const port = 3000
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
app.use(express.json())

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`)
    })
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

initializeDbAndServer()

const hasStatusAndPriorityProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriorityProperty = requestQuery => requestQuery.priority !== undefined

app.get('/todos/', async (request, response) => {
  let data = []
  let getTodoQuery = ''
  const {search_q = '', status, priority} = request.query

  switch (true) {
    case hasStatusAndPriorityProperties(request.query):
      getTodoQuery = `select * from todo where todo like ? and status=? and priority=?`
      data = [`%${search_q}%`, status, priority]
      break
    case hasStatusProperty(request.query):
      getTodoQuery = `select * from todo where todo like ? and status=?`
      data = [`%${search_q}%`, status]
      break
    case hasPriorityProperty(request.query):
      getTodoQuery = `select * from todo where todo like ? and priority=?`
      data = [`%${search_q}%`, priority]
      break
    default:
      getTodoQuery = `select * from todo where todo like ?`
      data = [`%${search_q}%`]
  }
  const todos = await db.all(getTodoQuery, data)
  response.send(todos)
})

app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from todo where id=?`
  const todo = await db.get(getTodoQuery, [todoId])
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const addTodoQuery = `insert into todo(id,todo,priority,status) values(?,?,?,?)`
  await db.run(addTodoQuery, [id, todo, priority, status])
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const todoDetails = request.body
  const {todo, status, priority} = todoDetails
  console.log(todo, status, priority)

  const getTodo = `select * from todo where id=?`
  const Todo = await db.get(getTodo, [todoId])

  let updateTodoQuery = ''
  let data = []
  let result = ''
  switch (true) {
    case todo !== undefined:
      updateTodoQuery = `update todo set todo=? where id=?`
      data = [todo, todoId]
      result = 'Todo Updated'
      break
    case status !== undefined:
      updateTodoQuery = `update todo set status=? where id=?`
      data = [status, todoId]
      result = 'Status Updated'
      break
    default:
      updateTodoQuery = `update todo set priority=? where id=?`
      data = [priority, todoId]
      result = 'Priority Updated'
      break
  }
  await db.run(updateTodoQuery, data)
  response.send(result)
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `delete from todo where id=?`
  await db.run(deleteTodoQuery, [todoId])
  response.send('Todo Deleted')
})

module.exports = app
