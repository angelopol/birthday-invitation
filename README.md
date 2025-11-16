# BirthdayInvitation 

Aplicación web en donde los cumpleañeros podran crear su pagina web personalizada en donde se mostraran datos como la fecha y ubicación de la fiesta, un link a pinterest para ver el dresscode de la fiesta, un boton para que los invitados confirmen su asistencia en la misma página y un segmento en donde el cumpleañero pondra cualquier texto extra opcional.

- Las tecnologias del proyecto seran React con Typescript y Tailwind y Next con MySql.
- Se debe realizar autenticacion login y registro para los cumpleañeros.
- Un modulo para la personalizacion de su pagina de cumpleanos. El link de su pagina sera el nombre de usuario del cumpleanero, el nombre de usuario debe ser un string apto para poder ser url, ej: birthdayinvitation.com/angelo. En la personalizacion de la pagina se pondran datos como la fecha de la fiesta, el link de google maps de la ubicacion del lugar, el link del repositorio de pinterest y el texto extra.
- Un modulo para registrar a los invitados, se debera poder ver cuales invitados han confirmado su asistencia y ademas debe estar un boton para compartir la invitacion con ese invitado, el boton de compartir solamente abrira un acceso directo a compartir el link el cual tendra como argumento el token de ese invitado, para acceder a la pagina del cumpleanero solo se podra si el usuario esta autenticado y es el dueno de la pagina o si el usuario esta entrando con su token de invitado, ej: birthdayinvitation.com/angelo?invitation=9821A8DSA8J, al crear el invitado se debe crear con su token unico de acceso a la invitacion, asi mismo este token funcionara como el identificador del invitado. El boton de confirmacion estara vinculado con este token de invitado. Aademas debe haber un boton para que el cumpleanero pueda resetar el registro de invitados, es decir, eliminar a todos los invitados en una misma accion.

# Modelos:
- BirthdayPeople:
    - username (string apto para url, unico primary key)
    - password
    - party_date (datetime)
    - ubication (url)
    - dress_code (url)
    - extra_info (text)

- Guests:
    - token (unico primary key)
    - name (string 255)
    - confirmated (boolean)
