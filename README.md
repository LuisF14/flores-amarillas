# Una flor amarilla para ti

Un regalo interactivo para el 21 de septiembre, de Perú a México. Next.js (App Router), TypeScript, Tailwind CSS y Framer Motion. Sin backend, base de datos ni servicios externos.

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:3000. En PowerShell, si la política de ejecución bloquea `npm.ps1`, usa `npm.cmd install` y `npm.cmd run dev`.

## Comprobar y compilar

```bash
npm run lint
npm run typecheck
npm run build
```

Las pruebas de interacción se ejecutan con `npm.cmd test` (requieren Google Chrome instalado). Comprueban las cuatro etapas, los toques repetidos, Enter/Espacio, la segunda sorpresa, el límite de 33 flores, Vienna real, volumen táctil, archivo ausente, alternativa sin Web Audio y movimiento reducido. Verifican 375×667, 390×844, 430×932, 768×1024, 1366×768 y 1920×1080. Las capturas quedan en `test-results/`. La emulación no sustituye una comprobación en dispositivos físicos.

La compilación genera una web estática en `out/`. Para previsualizarla puedes usar `npx serve out`. `next start` no es compatible con `output: "export"`; usa el servidor de desarrollo o un servidor de archivos estáticos.

## Interacción

- Toca la semilla, cualquier zona cercana a la planta o el botón: cuatro interacciones hacen aparecer el tallo, las hojas, el capullo y los pétalos.
- También funcionan Enter y Espacio. Con Tab puedes seleccionar los botones.
- Cada etapa termina antes de admitir otro toque, para conservar el ritmo de la historia.
- La dedicatoria aparece aproximadamente un segundo después de que se abran los últimos pétalos.
- «Una más» añade flores hasta cinco; entonces cambia a «¿Y si fueran muchas más? ✨».
- Al pulsarlo, el jardín se convierte en un campo de 25 flores que nacen escalonadamente tras una pausa de 800 ms. El mensaje aparece aproximadamente 1,5 segundos después de abrirse las últimas flores.
- Toca espacios libres del campo para plantar hasta ocho flores más (33 en total), o enfócalo con Tab y pulsa Enter/Espacio. Tocar el centro de una flor suelta pétalos; acercar el cursor provoca una ligera inclinación.
- El campo usa un solo canvas, flores determinísticas, pétalos prerenderizados en memoria, resolución limitada a 1,5× y aproximadamente 30 fps. Pausa el renderizado al ocultar la pestaña y detiene el movimiento continuo con movimiento reducido.
- Respeta la preferencia de movimiento reducido. No almacena datos personales.

## El jardín infinito

Tras el campo inicial aparece «Hay algo más ✨». Conserva la semilla, la primera flor y el jardín anteriores. La entrada captura el canvas actual y lo acerca mientras baja la cámara durante 3,5 segundos, mezclándolo con el campo nuevo. El reproductor vive en el componente padre: entrar al recorrido no lo desmonta ni reinicia la canción.

`InfiniteGarden.tsx` gestiona distancia, entrada, mensajes, gestos y cierre. `journeyScene.ts` dibuja seis capas con canvas 2D: cielo, horizonte, flores lejanas, medias, cercanas y primerísimo plano. Usa 200 posiciones determinísticas recicladas, 10 sprites prerenderizados y una franja distante pintada una sola vez. No usa WebGL, Three.js ni cientos de SVG. El render está limitado a aproximadamente 30 fps y 1,5× de resolución; pausa al ocultar la pestaña.

El avance automático permanece lento; el cierre comienza a los 56 segundos y queda completo hacia los 62,5 segundos. La rueda, un deslizamiento hacia arriba o las flechas/Enter/Espacio aumentan moderadamente la velocidad; el impulso se desvanece solo. El cursor aporta un parallax sutil, y tocar una flor cercana libera cuatro pétalos. No hay controles de videojuego.

Las nueve frases aparecen a los 4,5 / 9,5 / 14,5 / 19,5 / 25 / 31 / 36 / 41 / 46 segundos desde la invitación; cada una dura 4,5 segundos incluyendo fades cortos. El ritmo narrativo es independiente del impulso de cámara, para no acortar la lectura al deslizar. El reloj se pausa si la pestaña queda oculta. El cielo es nocturno desde el principio, con estrellas pequeñas y una banda tenue. Un camino oscuro curvo, flores doradas y luciérnagas aportan profundidad. Los textos pequeños alternan posiciones entre las flores y se acercan y desvanecen con la distancia. Entre 35,5 y 56 segundos hay un tramo sin texto; el avance se frena hasta un claro, donde «No hay prisa.», «Sigue floreciendo a tu tiempo. 💛» y «Feliz 21 de septiembre.» aparecen con pausas. El jardín continúa vivo sin nuevos mensajes.

Con movimiento reducido se elimina el desplazamiento de cámara, el parallax, el viento y las partículas móviles; se conserva el progreso narrativo sin desplazamiento del paisaje. En móvil el recorrido ocupa la pantalla, captura los gestos únicamente sobre su canvas y mantiene disponible el botón de música con safe areas.

Prueba manual: entra al viaje desde «Hay algo más», observa la continuidad, desliza/usa la rueda, toca flores y comprueba que la música continúa sin reiniciarse. Deja avanzar hasta el cierre, cambia de pestaña y vuelve, y prueba rotación y movimiento reducido. Verifica especialmente Safari en un iPhone físico con tu `vienna.mp3` autorizado.

## Música local

El archivo proporcionado por el usuario está en `public/audio/vienna.mp3`. La comprobación local devuelve HTTP 200 y `audio/mpeg`. No se ha descargado, sustituido ni modificado.

Pulsa «🎵 Música» para iniciar. El único `<audio>` persistente tiene `preload="auto"` y `loop`, sin autoplay. Volumen inicial: **55%**. La píldora despliega un panel con silenciar/reactivar y un `input type="range"` de 0 a 1, pasos de 0,01, porcentaje y área táctil de 44 px. El slider escribe directamente `audio.volume`; a cero muestra silenciado y pausa, al subirlo reanuda desde el mismo instante. Silenciar con el icono conserva el volumen elegido. Escape, otro toque en la píldora o un toque fuera cierran el panel.

`play()` y `AudioContext.resume()` se llaman desde el gesto; el estado activo espera sus promesas. Un GainNode separa el fade de 900/350 ms del volumen elegido y sirve de alternativa cuando el navegador ignora `audio.volume`, como ocurre en ciertas versiones de iOS. El reproductor no se desmonta entre escenas ni modifica `currentTime`. Los errores controlables usan `console.warn`, no overlays de desarrollo.

Las pruebas con el MP3 real verifican HTTP/MIME, metadata, `playing`, pausa, reanudación, volumen 0/100%, volumen intermedio y continuidad de instancia/tiempo. La muestra sintética se limita a la prueba de la alternativa sin Web Audio. Los tamaños móviles se prueban con touch emulado; esto no sustituye una comprobación en iPhone/Android físicos.

## Ritmo y controles móviles

En el campo móvil, la invitación queda centrada bajo las flores, dentro de una composición de `100svh`, con espacio reservado para la música y su panel inferior derecho. Tiene área mínima de 46 px, entrada suave y un pequeño pulso cada seis segundos; las animaciones se omiten con movimiento reducido. Se respetan las safe areas.

Entre reflexiones aparecen una pequeña brisa de pétalos, luciérnagas, inclinaciones de flores, una estrella fugaz y un cambio leve del viento. A partir de los 51 segundos se frena la cámara y se abre el claro. Algunas luciérnagas convergen irregularmente hacia el centro. «No hay prisa.» aparece a los 56 s, la segunda línea a los 59 s y el saludo a los 61,5 s. El saludo acompaña una única brisa con cuatro pétalos y algo más de luz; luego el jardín y la música continúan sin cambiar de página.

## Publicar en Vercel

Sube esta carpeta a un repositorio e impórtalo en Vercel. Selecciona Next.js; si el repositorio contiene varios proyectos, configura `flores-amarillas` como Root Directory. Comando de instalación: `npm install`. Compilación: `npm run build`. No requiere variables de entorno. Conserva los ajustes de salida automáticos de Vercel.

## Personalizar

- Título, dedicatoria y mensajes: `components/GrowingFlower.tsx` y `components/Message.tsx`.
- Flor SVG y animación: `components/Flower.tsx`.
- Distribución del jardín y límite: `components/Garden.tsx`.
- Segunda sorpresa y campo interactivo: `components/FlowerField.tsx`.
- Reproducción y control flotante: `components/useBackgroundMusic.ts` y `components/SoundButton.tsx`.
- Paleta, tipografía y diseño adaptable: `app/globals.css`.
- Metadatos: `app/layout.tsx`.

La tipografía usa fuentes del sistema para que el regalo no dependa de servicios de fuentes externos.



