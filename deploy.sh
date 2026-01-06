#!/bin/bash

set -e  # Прерывать выполнение при ошибке любой команды

# Отключаем цветной вывод для docker команд
export NO_COLOR=1

echo "Останавливаем контейнер florally-front..."
docker stop florally-front || echo "Контейнер florally-front не запущен или уже остановлен"

echo "Удаляем контейнер florally-front..."
docker rm florally-front || echo "Контейнер florally-front не существует или уже удален"

echo "Удаляем образ florally-front..."
docker image rm florally-front || echo "Образ florally-front не существует или уже удален"

echo "Собираем новый образ..."
docker build --no-cache -t florally-front .

echo "Запускаем контейнер..."
docker run -p 5173:5173 -d --name=florally-front florally-front

# Сброс цветов и форматирования терминала
printf "\033[0m"

echo "Скрипт завершен успешно"