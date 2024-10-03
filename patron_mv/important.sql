//npm i  --save mysql2 //es mas rapido
CREATE DEFINER = CURRENT_USER TRIGGER `moviesdb`.`movies_AFTER_DELETE` AFTER DELETE ON `movies` FOR EACH ROW
BEGIN
	DELETE FROM movie_genres WHERE movie_id = old.movie_id;

END

DELETE FROM `moviesdb`.`movies`
WHERE  BIN_TO_UUID(id) = "08cb3f75-8179-11ef-9a32-047c16ae5708";


