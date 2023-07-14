FROM ubuntu:latest

ENV TZ=Asia/Dubai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
# Install update.
RUN apt-get update && apt-get install -y \
    wget \
    python3 \
    python3-pip

RUN apt-get install -y wkhtmltopdf

# Copy files over
WORKDIR /app
COPY . .
RUN python3 -m pip install -r requirements.txt
RUN mkdir temp
RUN chmod +x "start.sh"

EXPOSE 5000

ENTRYPOINT [ "./start.sh" ]
