# course-list-generator

This program automates the searching, and compiling of campus course OL links

Follow the prompts to log in to d2l, select the semester, and enter your search query

Due to d2l, and browser conflicts, the program may need to run more than once.

## Install
```
npm install -g https://github.com/byuitechops/course-list-generator.git
``` 
## Run
```
course-list-generator
```
## CLI Instructions
When ran the program asks for the following information:

#### Domain
```
Which domain? Type 'p' for Pathway and anything else for BYUI:
```
This allows you to speifiy if you are on byui or the pathway domain. Type `p` for Pathway or `enter` for BYUI.

#### Username
```
username:
```
Your D2L username

#### Password
```
password:
```
Your password for the above username

#### Semester
```
Type in the semester in this format: Winter 2017:
```
This is what you would type into the **Select Semester** dialog box search. The program then pick the first on the list.

#### Search Query
```
Type your search query:
```
This is what you would typr into the course search box.

## Output
The program outputs a csv file that is easily consumed by other scripts. It looks like this:

| ou   | link                                         | name                |
|------|----------------------------------------------|---------------------|
| 1234 | https://byui.brightspace.com/d2l/p/home/1234 | My Best Course Ever |
