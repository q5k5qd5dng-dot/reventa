export interface Article { slug: string; t: string; body: string[]; upd: string }
export interface Collection { id: string; n: string; d: string; icon: "ticket" | "rocket" | "bank" | "finger"; items: Article[] }

const a = (slug: string, t: string, body: string[], upd = "hace 2 semanas"): Article => ({ slug, t, body, upd });

export const help: Collection[] = [
  {
    id: "comprar", n: "Comprar entradas", d: "Encuentra toda la información sobre la compra de entradas", icon: "ticket",
    items: [
      a("como-comprar", "¿Cómo compro una entrada?", ["Comprar en Handticket lleva un par de minutos:", "1. Busca tu evento en el buscador de la portada y ábrelo.", "2. Elige el tipo de entrada (por ejemplo, abono o entrada de un día) y el anuncio que más te guste.", "3. Pulsa «Comprar», revisa el total y confirma el pago.", "4. Tu entrada aparecerá al momento en «Mis entradas», con su código QR.", "Necesitas una cuenta para comprar. Si no la tienes, puedes crearla en la propia compra."]),
      a("metodos-pago", "¿Qué métodos de pago puedo usar?", ["Aceptamos las principales tarjetas de débito y crédito. Tu pago queda protegido: Handticket retiene el importe y no se lo entrega al vendedor hasta que ha tenido lugar el evento.", "Si tu banco te pide una verificación adicional (por ejemplo, un código por SMS), complétala para que el pago se confirme."]),
      a("cuando-recibo", "¿Cuándo recibiré mi entrada?", ["En la mayoría de los casos, al instante: en cuanto el pago se confirma, la entrada está disponible en «Mis entradas».", "En eventos que exigen cambio de nombre, la entrega puede tardar un poco más porque el vendedor debe completar el proceso. Te avisaremos por email en cuanto esté lista."]),
      a("donde-estan", "¿Dónde encuentro mis entradas compradas?", ["Inicia sesión y entra en «Mis entradas» desde el menú superior. Allí verás cada compra con su QR, el código de pedido y los botones para descargarla o verla en pantalla completa.", "También puedes descargar la entrada como imagen para tenerla sin conexión el día del evento."]),
      a("gastos-gestion", "¿Qué son los gastos de gestión?", ["Son una pequeña tarifa por usar Handticket que cubre la verificación de la entrada, la protección del pago y el soporte durante todo el proceso.", "Siempre ves el desglose antes de pagar: entradas + gastos de gestión = total. En algunos anuncios el precio mostrado ya los incluye."]),
      a("autentica", "¿Cómo sé que la entrada es auténtica?", ["Todas las entradas pasan por nuestro protocolo antifraude antes de publicarse: comprobamos el código QR, que no esté duplicado y que el vendedor tenga el teléfono y la cuenta bancaria verificados.", "Además, en eventos con cambio de nombre invalidamos la entrada original y emitimos una nueva a tu nombre."]),
      a("no-funciona", "La entrada no me funciona en la puerta, ¿qué hago?", ["Mantén la calma: tu pago está protegido.", "1. Aumenta el brillo del móvil y acerca el QR al lector; las pantallas con poco brillo fallan a menudo.", "2. Si el lector lo rechaza, pide ayuda al personal del acceso y enséñales tu pedido.", "3. Escríbenos desde el Centro de ayuda indicando el evento y el código de pedido. Te devolveremos el importe o te conseguiremos una entrada equivalente."]),
      a("devoluciones", "¿Puedo cancelar o devolver una compra?", ["Las compras son firmes una vez confirmadas, porque el vendedor ya ha reservado su entrada para ti. Si no puedes asistir, puedes volver a ponerla a la venta desde «Mis entradas» > «Revender».", "La excepción son los problemas con la entrada (no válida, duplicada o distinta a la anunciada): en ese caso tienes derecho al reembolso completo."]),
      a("evento-cancelado", "¿Qué pasa si el evento se cancela o se aplaza?", ["Si el evento se cancela, te devolvemos el importe completo, incluidos los gastos de gestión, de forma automática.", "Si se aplaza, tu entrada normalmente sigue siendo válida para la nueva fecha. Si no puedes asistir, puedes revenderla o solicitar el reembolso cuando el organizador lo permita."]),
      a("cambio-nombre", "¿Cómo hago el cambio de nombre de la entrada?", ["Cuando el evento lo requiere, el vendedor realiza el cambio de nombre a tu nombre tras la compra. Tú solo tienes que comprobar que tus datos son correctos en «Perfil».", "Recibirás un aviso cuando el cambio esté hecho y la nueva entrada aparezca en tu cuenta."]),
      a("sin-email", "No me ha llegado el email de confirmación", ["Revisa la carpeta de spam o promociones. Si no aparece, comprueba que el email de tu «Perfil» está bien escrito.", "No necesitas el email para entrar al evento: tu entrada está siempre en «Mis entradas», con su QR."]),
      a("varias", "¿Puedo comprar varias entradas a la vez?", ["Sí, hasta 6 en una misma compra, siempre que el anuncio tenga esa cantidad disponible. Verás el número de entradas de cada anuncio antes de comprar.", "Las entradas de un mismo pedido llegan juntas a tu cuenta; puedes descargarlas por separado para repartirlas."]),
    ],
  },
  {
    id: "vender", n: "Vender entradas", d: "¿Quieres vender una entrada o has vendido una entrada? Esto te interesa", icon: "rocket",
    items: [
      a("como-vender", "¿Cómo vendo mi entrada?", ["Vender es gratis y muy rápido:", "1. Pulsa «Vender entrada» en la cabecera.", "2. Elige el evento y el tipo de entrada, indica cuántas vendes y el precio.", "3. Publica el anuncio. Te avisamos cuando alguien lo compre.", "4. Cobras automáticamente después del evento."]),
      a("formatos", "¿Qué formatos de entrada puedo subir?", ["Puedes subir tu entrada en PDF o como captura de pantalla clara. Asegúrate de que el código QR se ve completo y sin recortes.", "Si tu PDF tiene varias páginas, podrás elegir cuáles quieres vender y las demás no se compartirán con nadie."]),
      a("comision", "¿Cuánto cuesta vender?", ["Publicar un anuncio es gratis. Solo cobramos una comisión del 10 % cuando la entrada se vende.", "Antes de publicar, ves cuánto cobrarás exactamente: venta bruta menos comisión."]),
      a("precio", "¿Qué precio puedo poner?", ["Tú decides el precio dentro de los límites de la normativa y de las condiciones de cada evento. Te mostramos un precio orientativo según la demanda para que vendas antes.", "Puedes cambiarlo en cualquier momento desde «Mis anuncios» mientras no esté vendida."]),
      a("cuando-cobro", "¿Cuándo cobro mi dinero?", ["Se paga automáticamente después del evento, mediante transferencia SEPA a la cuenta que indicaste. El proceso suele tardar unos días hábiles.", "Hasta entonces el importe queda retenido de forma segura; así garantizamos que el comprador pueda entrar al evento."]),
      a("cuenta-bancaria", "¿Cómo añado mi cuenta bancaria?", ["Al vender por primera vez te pediremos un IBAN válido y el nombre del titular. Solo lo usamos para ingresarte el pago de tus ventas: no podemos hacer cargos en esa cuenta.", "Los datos se almacenan cifrados. Puedes cambiarlos escribiendo a soporte antes de que se emita el pago."]),
      a("editar-anuncio", "¿Cómo edito o cambio el precio de un anuncio?", ["Entra en «Mis anuncios», pulsa «Cambiar precio» en el anuncio y guarda. El cambio es inmediato.", "Si ya hay un comprador en proceso de pago, el precio con el que empezó se mantiene."]),
      a("retirar", "¿Cómo retiro un anuncio?", ["En «Mis anuncios», pulsa «Retirar». El anuncio deja de verse al momento.", "Solo puedes retirar anuncios que aún no se han vendido. Una vez vendida, la entrada debe entregarse."]),
      a("alguien-compra", "¿Qué pasa cuando alguien compra mi entrada?", ["Te avisamos por notificación y email. Tu entrada se reserva para el comprador y, si el evento exige cambio de nombre, te indicamos cómo hacerlo.", "No tienes que contactar con el comprador: nos encargamos de todo."]),
      a("he-vendido", "He vendido mi entrada, ¿tengo que hacer algo?", ["En la mayoría de los casos, nada. Solo si el evento pide cambio de nombre te enviaremos instrucciones sencillas.", "Importante: no uses la entrada ni la compartas con otras personas después de venderla, o dejará de ser válida para el comprador."]),
      a("vender-parte", "¿Puedo vender solo parte de mi pedido?", ["Sí. Si tienes varias entradas y solo quieres vender algunas, indica la cantidad al publicar. Las demás siguen siendo tuyas.", "Los compradores pueden elegir comprar todas las de tu anuncio o solo una parte."]),
      a("rechazada", "¿Por qué se rechazó mi entrada?", ["Rechazamos entradas cuando el QR no se puede leer, está duplicado, el evento ya ha pasado o no cumple las condiciones del organizador.", "Te explicamos el motivo exacto por email. Si crees que es un error, responde a ese mensaje y lo revisamos."]),
      a("nominativa", "Mi entrada es nominativa, ¿puedo venderla?", ["Depende del organizador. Muchas entradas nominativas permiten el cambio de nombre y, en ese caso, puedes venderlas sin problema.", "Si el organizador no lo permite, no podrás publicarla. Revisa las condiciones de tu entrada o consúltanos el caso concreto."]),
    ],
  },
  {
    id: "seguridad", n: "Seguridad", d: "Descubre las medidas de seguridad de Handticket para proteger a nuestros usuarios", icon: "bank",
    items: [
      a("antifraude", "Nuestro protocolo antifraude", ["Aplicamos un riguroso protocolo antifraude: verificamos cada código QR, detectamos duplicados, comprobamos la identidad del vendedor (teléfono y cuenta bancaria) y monitorizamos comportamientos sospechosos.", "Si algo no encaja, el anuncio no se publica."]),
      a("pago-protegido", "Cómo protegemos tu pago", ["El comprador paga a Handticket, no al vendedor. Mantenemos el importe retenido hasta que se celebra el evento, y solo entonces se transfiere al vendedor.", "Si algo falla con la entrada, devolvemos el dinero."]),
      a("vendedores", "Verificación de vendedores", ["Todos los vendedores verifican su teléfono y su cuenta bancaria. En cada anuncio puedes ver esas verificaciones y cuántas entradas ha vendido ya esa persona."]),
      a("reportar", "Cómo reportar un anuncio sospechoso", ["Si ves algo extraño, escríbenos desde el Centro de ayuda con el enlace del anuncio. Lo revisamos con prioridad y, si es necesario, lo retiramos y bloqueamos la cuenta."]),
    ],
  },
  {
    id: "cuenta", n: "Mi cuenta", d: "¿Tienes problemas con tu cuenta? Te indicamos cómo resolverlos aquí", icon: "finger",
    items: [
      a("crear-cuenta", "¿Cómo creo mi cuenta?", ["Pulsa «Iniciar sesión» y elige «Crear cuenta». Solo necesitas tu nombre, email y una contraseña de al menos 8 caracteres."]),
      a("contrasena", "He olvidado mi contraseña", ["En la pantalla de acceso, pulsa «¿Olvidaste la contraseña?» e introduce tu email. Te enviaremos un enlace para crear una nueva.", "Si no recibes el correo, revisa el spam o escríbenos."]),
      a("datos", "¿Cómo cambio mi nombre o mi email?", ["Abre el menú de tu cuenta y entra en «Perfil». Edita tus datos y guarda los cambios.", "Si compraste una entrada con cambio de nombre, el nombre del pedido no cambia."]),
      a("eliminar", "¿Cómo elimino mi cuenta?", ["Escríbenos desde el Centro de ayuda pidiendo la baja. Antes de eliminar tu cuenta debes tener todos los pagos de tus ventas liquidados y no tener compras de eventos futuros."]),
    ],
  },
];

export const allArticles = () => help.flatMap((c) => c.items.map((i) => ({ ...i, cat: c })));
export const count = (c: Collection) => `${c.items.length} artículo${c.items.length === 1 ? "" : "s"}`;
