import mysql from "mysql2/promise"

const config = {
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: '',
    database: 'moviesdb'

}

const connection = await mysql.createConnection(config)

export class MovieModel {
  static async getAll ({ genre }) {
    let movies = `select  BIN_TO_UUID(movie_id) id , title,year,director,duration,poster,rate,g.name from movie_genres mg
	inner join movies m  on mg.movie_id = m.id
    inner join genres g on mg.genre_id = g.id`
    if (genre){
        const lowerCaseGenre = genre.toLowerCase()
        movies = movies + "   WHERE LOWER(name) = ?;"
        const [result] = await connection.query(movies, lowerCaseGenre)  //desestructuro pq viene dos
        if (result.length === 0 ) return []
        return result;
    }

    const [result] = await connection.query(movies)  //desestructuro pq viene dos
    return result;
  }

  static async getById ({ id }) {
    if ( id) {
        const movie = `select  BIN_TO_UUID(movie_id), title,year,director,duration,poster,rate,g.name from movie_genres mg
                        inner join movies m  on mg.movie_id = m.id
                        inner join genres g on mg.genre_id = g.id
                        where BIN_TO_UUID(movie_id) = ?;`
        const [result] = await connection.query(movie, id)  //desestructuro pq viene dos
        if (result.length === 0 ) return null
        return result;
    }
  }

  static async create ({ input }) {
    
    const {
        genre: genreInput, // genre is an array
        title,
        year,
        duration,
        director,
        rate,
        poster
      } = input
      
    
      const [uuidResult] = await connection.query('SELECT UUID() uuid;')
      const [{ uuid }] = uuidResult
      console.log(`uid > ${uuid}`);
      
      try {
        await connection.query(
          `INSERT INTO movies (id, title, year, director, duration, poster, rate)
            VALUES (UUID_TO_BIN("${uuid}"), ?, ?, ?, ?, ?, ?);`,
          [title, year, director, duration, poster, rate]
        )
      } catch (e) {
        throw new Error('Error al crear movie')
        // enviar la traza a un servicio interno
      }
  
      //insertar en generes
      for (const genreName of genreInput) {
        try {
          const movie = `select id from genres where name  = ?;`
          const result = await connection.query(movie, genreName) 
          const [{id}] = result [0]
          if (id){
            const inMov = `insert into movie_genres (movie_id,genre_id) values (UUID_TO_BIN("${uuid}"),${id});`
            await connection.query( inMov);
          }
        } catch (e) {
            throw new Error('Error al crear el  genero'+ e);
        }
       }
      ////////////////
      const [movies] = await connection.query(
        `select    title,year,director,duration,poster,rate,g.name from movie_genres mg
                        inner join movies m  on mg.movie_id = m.id
                        inner join genres g on mg.genre_id = g.id
                        where BIN_TO_UUID(movie_id) = ?;`,
        [uuid]
      )
      return movies
  }

  static async delete ({ id }) {
   try {
    const removeMovie = await connection.query(`DELETE FROM movies WHERE  BIN_TO_UUID(id) =? `,[id])

   } catch (error) {
    console.log(`Error al eliminar la pelicula`);
   }
  }

  static async update ({ id, input }) {
    try {
      const uptMovie = await connection.query(`UPDATE movies
      SET
      title = "${input.title}",
      year = ${input.year},
      director = "${input.director}",
      duration = ${input.duration},
      poster ="${input.poster}",
      rate = ${input.rate}
      WHERE BIN_TO_UUID(id) = "${id}" ` ) 
      if (uptMovie) {
        const [res] = await connection.query(
          `select    title,year,director,duration,poster,rate,g.name from movie_genres mg
                          inner join movies m  on mg.movie_id = m.id
                          inner join genres g on mg.genre_id = g.id
                          where BIN_TO_UUID(movie_id) = ?;`,
          [id]
        )
        return res[0]
      }

     } catch (error ) {
      console.log(`Error al acturalizar la pelicula `+ error.message );
     }
  }
}
