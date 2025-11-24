# BirthdayInvitation 

Aplicación web en donde los cumpleañeros podran crear su pagina web personalizada en donde se mostraran datos como la fecha y ubicación de la fiesta, un link a pinterest para ver el dresscode de la fiesta, un boton para que los invitados confirmen su asistencia en la misma página y un segmento en donde el cumpleañero pondra cualquier texto extra opcional.


# Modelos:
- BirthdayPeople:
    - username (string apto para url, unico primary key)
    - password

- Guests:
    - token (unico primary key)
    - name (string 255)
    - confirmated (boolean)
