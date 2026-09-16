# AI assistant database schema

## Session
- id
- user id
- name
- updated at
- created at

## Chat
- id
- session id
- question
- answer
- question audio
- answer audio
- plans
- created at

## Attachments
- id
- session id
- chat id
- file name
- file size
- file summary
- uploaded at