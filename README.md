# 🧙‍♂️ ArcaneStep 🧙‍♂️
2nd Place at Eureka Hacks 2025 https://eurekahacks.ca/

## ArcaneStep Inspiration 🧙‍♂️ 
According to the Canadian Paediatric Society, nearly all children in Canada are exposed to screens by the age of 2, and only 15% of Canadian children aged 3 to 4 meet screen time guidelines of less than an hour per day. Along with this, SickKids stated in an article, "Screen time is an important and unavoidable part of your child's life…". This is why we decided to create a game that incorporates outdoor physical activity and taking breaks from the screen into the core gameplay.
## What it does 🧙‍♂️ 
Arcane Steps is a web-based game where players control a wizard who casts spells by doing exercises. As players walk in real life, their steps are tracked and converted into mana, which is used to cast spells and battle enemies. Players download a shortcut to their mobile devices, which takes data from the Health app and uploads it to the program. The program then calculates how much mana is gained based on how many steps were taken. Every time the player wants to attack an enemy, three exercises are displayed on the screen that need to be completed before the spell is cast. The game uses the laptop's webcam along with a machine learning model that was trained on specific exercises using Google's Teachable Machines. When the player runs out of mana, the game prompts the player to recharge their mana by stepping away from the screen and going for a walk. When they return, the number of steps is converted into mana, and the battle resumes.
## How we built it 🧙‍♂️
We used HTML, CSS, and JavaScript for this project, as well as Google's Teachable Machines to train the Machine Learning model. A flask server was used with a webhook, to gather the step data from the phone's health app.
