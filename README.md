# Basic Chat

## This code was generated from the following prompt to gpt4o

Write a node Express Web server that interacts with various OpenAI API functions to hold a conversation with a user via serving up a web page. The web page should allow as input a System message and a prompt and display the response in a scrolling area. There should be a drop-down menu to select the model eg gpt-3.5, gpt-4o etc, button that creates a new "thread" and a Run button that takes the system and prompt messages and puts them onto the thread and runs the thread and then waits or polls for the LLM response. The response should be at the bottom of the page and may contain different types of messages and these should be displayed in different colors. The user can Run new prompts or create a new context window by creating a new thread. Use Bootstrap and allow for either light or dark layout. Use the openai Version 4 library for Web Server http calls to OpenAI and "fetch" for http GET and POST in the Web Page . Download first the latest OpenAI API call formats and make sure you call them using using the openai object and NOT via a url. Install libraries using module style.

# Basic Assistant 

Write a node Express Web server that serves a Web page allows calls OpenAI API functions. The web page should have the following capabilities
1) Create or Get Assistant by Name: This checks to see if an assistant by that name exists for the user and creates one giving it an system prompt 
2) Choose a model for the Assistant
3) Create a new thread, clear the response window and add the user Prompt to the thread
4) Run the thread and poll OpenAI for the Response 

 The web page should allow as input a System message and a prompt and display the response in a scrolling area. There should be a drop-down menu to select the model eg gpt-3.5, gpt-4o etc, button that creates a new "thread" and a Run button that takes the system and prompt messages and puts them onto the thread and runs the thread and then waits or polls for the LLM response. The response should be at the bottom of the page and may contain different types of messages and these should be displayed in different colors. The user can Run new prompts or create a new context window by creating a new thread. Use Bootstrap and allow for either light or dark layout. Use the openai Version 4 library for Web Server http calls to OpenAI and "fetch" for http GET and POST in the Web Page . Download first the latest OpenAI API call formats and make sure you call them using using the openai object and NOT via a url. Install libraries using module style.