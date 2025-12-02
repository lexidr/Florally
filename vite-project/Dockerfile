FROM node:22

# создание директории приложения
WORKDIR /usr/src/app

# установка зависимостей
# символ астериск ("*") используется для того чтобы по возможности
# скопировать оба файла: package.json и package-lock.json
COPY package*.json ./

ARG ENV_FILE=.env.prod
COPY ${ENV_FILE} .env

RUN npm install

# копируем исходный код
COPY . .

RUN npm run build
EXPOSE 5173
CMD npm run preview