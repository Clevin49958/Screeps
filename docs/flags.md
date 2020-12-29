# Flags

Flags will be used to indicate destinations, instead of memory. These will be used for permanent structures that we do not want to be destroyed after a global reset. (Planed construction sites in particular)

Color system will be used to indicate their type

 - grey
   - grey
     - used to direct screeps to move to room center when there is no vision in the room
     - @name = ```room.name```
 - yellow
   - green
     - indicate the position for upgrader to sit
     - @name = ```up-${room}-${index}```
     - index max = 2?
   - grey
     - indicate the position for keeper to sit
       @name = ```keeper-${room}```
 - blue
   - blue
     - structure planer
     - @name = ```site-${room}-${structureType}-${[index]}```
