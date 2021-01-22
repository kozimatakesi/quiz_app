const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.urlencoded({ extended: false }));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'quiz',
});

connection.connect((err) => {
  if (err) {
    console.log(`error connecting: ${err.stack}`);
    return;
  }
  console.log('success');
});

// メイン画面
app.get('/index', (req, res) => {
  res.render('index.ejs', {
    errors: [], question: [], choices1: [], choices2: [], choices3: [], check1: [], check2: [], check3: [],
  });
});

// クイズの作成
app.post('/create',
// 入力値の空チェック
  (req, res, next) => {
    const {
      question,
      choices1,
      choices2,
      choices3,
      radio1,
      radio2,
      radio3,
    } = req.body;
    const errors = [];
    let check1 = '';
    let check2 = '';
    let check3 = '';

    if (question === '') {
      errors.push('問題が空です');
    }
    if (choices1 === '') {
      errors.push('選択肢1が空です');
    }
    if (choices2 === '') {
      errors.push('選択肢2が空です');
    }
    if (choices3 === '') {
      errors.push('選択肢3が空です');
    }
    if (radio1 !== 'on' && radio2 !== 'on' && radio3 !== 'on') {
      errors.push('正解の選択肢にチェックを入れてください');
    }

    if (radio1 === 'on') {
      check1 = 'checked';
    } else if (radio2 === 'on') {
      check2 = 'checked';
    } else if (radio3 === 'on') {
      check3 = 'checked';
    }

    if (errors.length > 0) {
      res.render('index.ejs', {
        errors, question, choices1, choices2, choices3, check1, check2, check3,
      });
    } else {
      next();
    }
  },
  (req, res) => {
    let answer = '答え';
    if (req.body.radio1 === 'on') {
      answer = req.body.choices1;
    } else if (req.body.radio2 === 'on') {
      answer = req.body.choices2;
    } else {
      answer = req.body.choices3;
    }

    connection.query(
      'INSERT INTO quizzes(question, choices1, choices2, choices3, answer) VALUES (?, ?, ?, ?, ?)',
      [req.body.question, req.body.choices1, req.body.choices2, req.body.choices3, answer],
      (error, results) => {
        connection.query(
          'SELECT * FROM quizzes',
          (error, results) => {
            res.redirect('/quiz');
          },
        );
      },
    );
  });

// クイズ一覧
app.get('/quiz', (req, res) => {
  connection.query(
    'SELECT * FROM quizzes',
    (error, results) => {
      res.render('quiz.ejs', { quizzes: results });
    },
  );
});

// クイズの削除
app.post('/delete/:id', (req, res) => {
  console.log('削除しますよ');
  connection.query(
    'DELETE FROM quizzes WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.redirect('/quiz');
    },
  );
});

// クイズ回答画面
app.get('/answer', (req, res) => {
  connection.query(
    'SELECT id FROM quizzes',
    (error, results) => {
      const quizIndex = [];
      const quizLength = results.length;
      let num = 0;
      while (num < quizLength) {
        quizIndex.push(results[num].id);
        num++;
      }
      // クイズのID一覧
      console.log(quizIndex);
      // ランダムで選ばれたクイズのID
      console.log(`${quizIndex[Math.floor(Math.random() * quizIndex.length)]}が選ばれた`);
      const a = quizIndex[Math.floor(Math.random() * quizIndex.length)];
      connection.query(
        'SELECT * FROM quizzes WHERE id = ?',
        [a],
        (error, results) => {
          res.render('answer.ejs', { quizzes: results });
        },
      );
    },
  );
});

app.listen(3000, () => {
  console.log('Starting your application server at http://localhost:3000');
});
