'use strict';

const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs');

const GITHUB_API_ENDPOINT = 'https://api.github.com/repos';

const USER_AUTH = {
  username: null,
  password: null
};

const authPrompts = [
  {
    type: 'input',
    name: 'username',
    message: 'Enter github username:'
  },
  {
    type: 'input',
    name: 'password',
    message: 'Enter github password:',
    transformer: () => {
      return '';
    }
  }
];

const repoPrompts = [
  {
    type: 'input',
    name: 'owner',
    message: 'Enter the owner of the repo:'
  },
  {
    type: 'input',
    name: 'repo',
    message: 'Enter the name of the repo:'
  }
];

function getIssues(owner, repo) {
  return axios
    .get(`${GITHUB_API_ENDPOINT}/${owner}/${repo}/issues`, {
      auth: {
        username: USER_AUTH.username,
        password: USER_AUTH.password
      }
    })
    .then(res => {
      return res.data;
    });
}

inquirer
  .prompt(authPrompts)
  .then(answers => {
    if (
      !answers.username ||
      !answers.password ||
      answers.username.length < 1 ||
      answers.password.length < 1
    ) {
      console.error('Invalid input, please try again.');
    }
    USER_AUTH.username = answers.username;
    USER_AUTH.password = answers.password;
  })
  .then(() => {
    return inquirer.prompt(repoPrompts);
  })
  .then(answers => {
    return getIssues(answers.owner, answers.repo).then(issues => {
      const formattedIssues = issues.map(issue => {
        return {
          url: issue.url,
          title: issue.title,
          assignee: issue.assignee && issue.assignee.login,
          created_at: issue.created_at,
          closed_at: issue.closed_at,
          body: issue.body,
          state: issue.open,
          number: issue.number
        };
      });

      if (formattedIssues && formattedIssues.length > 0) {
        const filename = `${answers.owner}_${answers.repo}.json`;
        console.log('Extracted issues.');
        console.log('Writing to file..');
        try {
          fs.writeFileSync(filename, JSON.stringify(formattedIssues));
        } catch (error) {
          console.error(error);
        }
        console.log('File ', filename, ' sucessfully created.');
      }
    });
  })
  .catch(error => {
    if (error.response) {
      console.error(
        'Error: ',
        error.response.status,
        error.response.statusText
      );
    } else {
      console.error(error.message);
    }
  });
