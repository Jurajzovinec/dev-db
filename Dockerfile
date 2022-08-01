FROM mariadb:10.5.13

ENV MARIADB_ROOT_PASSWORD demo
ENV MARIADB_USER demo
ENV MARIADB_PASSWORD demo
ENV MARIADB_DATABASE demo
       
COPY ./dump /docker-entrypoint-initdb.d/

EXPOSE 3306

CMD ["mysqld"]
