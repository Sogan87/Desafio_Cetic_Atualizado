const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'localhost', // host do banco de dados
  port:3306,
  user: 'sandro', // usuário do banco de dados
  password: 'root',
  database: 'task_manager', // nome do banco de dados
  
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Rota principal
app.get('/', (req, res) => {
  // Renderiza a página inicial
  res.render('index');
});

// Rota de cadastro de usuários
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Criptografa a senha antes de salvar no banco de dados
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insere o usuário no banco de dados
  const user = { name, email, password: hashedPassword };
  db.query('INSERT INTO users SET ?', user, (err, result) => {
    if (err) throw err;
    console.log('User registered:', result.insertId);

    // Redireciona para a página de login após o cadastro
    res.redirect('/login');
  });
});

// Rota de autenticação de usuários
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Busca o usuário no banco de dados pelo email
  db.query('SELECT * FROM users WHERE email = ?', email, (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const user = result[0];

      // Compara a senha informada com a senha criptografada no banco de dados
      if (bcrypt.compareSync(password, user.password)) {
        console.log('User logged in:', user.id);

        // Redireciona para a página de listagem de tarefas após o login
        res.redirect('/tasks');
      } else {
        // Senha incorreta
        res.redirect('/');
      }
    } else {
      // Usuário não encontrado
      res.redirect('/');
    }
  });
});

// Rota de listagem de tarefas
app.get('/tasks', (req, res) => {
  // Busca todas as tarefas do usuário autenticado no banco de dados
  db.query('SELECT * FROM tasks WHERE userId = ? ORDER BY dueDate', 1, (err, result) => {
    if (err) throw err;

    // Renderiza a página de listagem de tarefas com as tarefas encontradas
    res.render('tasks', { tasks: result });
  });
});

// Rota de criação de tarefas
app.post('/tasks', (req, res) => {
  const { title, description, dueDate } = req.body;

  // Insere a nova tarefa no banco de dados associada ao usuário autenticado
  const task = { userId: 1, title, description, dueDate, completed: 0};
  db.query('INSERT INTO tasks SET ?', task, (err, result) => {
    if (err) throw err;
    console.log('Task created:', result.insertId);

// Redireciona para a página de listagem de tarefas após a criação da tarefa
res.redirect('/tasks');
    });
});

// Rota de marcação de tarefa como concluída
app.post('/tasks/:id/complete', (req, res) => {
const { id } = req.params;

// Atualiza o status da tarefa para concluída no banco de dados
db.query('UPDATE tasks SET isCompleted = 1 WHERE id = ?', id, (err, result) => {
    if (err) throw err;
    console.log('Task marked as completed:', id);
  
    // Redireciona para a página de listagem de tarefas após a marcação da tarefa como concluída
    res.redirect('/tasks');
  });
});

// Rota de exclusão de tarefas
app.post('/tasks/:id/delete', (req, res) => {
const { id } = req.params;

// Deleta a tarefa do banco de dados
db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
    if (err) throw err;
    console.log('Task deleted:', id);
  
    // Redireciona para a página de listagem de tarefas após a exclusão da tarefa
    res.redirect('/tasks');
  });
});

// Inicia o servidor na porta especificada
app.listen(3000, () => {
console.log('Server running on port 3000'); 
});