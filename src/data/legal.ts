export interface LegalSec { h: string; p: string[] }
export interface LegalDoc { slug: string; n: string; upd: string; intro: string; secs: LegalSec[] }

const upd = "1 de octubre de 2026";

export const legal: LegalDoc[] = [
  {
    slug: "terminos", n: "Términos y condiciones", upd,
    intro: "Estas condiciones regulan el uso de Handticket, un mercado donde particulares compran y venden entradas de forma segura. Léelas antes de comprar o vender.",
    secs: [
      { h: "1. Quiénes somos y qué hacemos", p: ["Handticket es una plataforma de intermediación: pone en contacto a vendedores y compradores de entradas y gestiona el pago y la entrega. Handticket no organiza los eventos ni es titular de las entradas, y no es parte del contrato de compraventa entre comprador y vendedor, salvo en lo necesario para custodiar el pago y entregar la entrada.", "Al crear una cuenta o usar la plataforma aceptas estas condiciones, la Política de privacidad y la Política de cookies."] },
      { h: "2. Tu cuenta", p: ["Debes ser mayor de 18 años y facilitar datos verdaderos y actualizados. Eres responsable de la confidencialidad de tu contraseña y de la actividad que se realice desde tu cuenta.", "Podemos suspender o cerrar cuentas que incumplan estas condiciones, intenten defraudar o pongan en riesgo a otros usuarios."] },
      { h: "3. Comprar entradas", p: ["Al pulsar «Comprar» formalizas la compra de las entradas del anuncio elegido por el precio total indicado, que incluye el precio de las entradas y los gastos de gestión. El desglose se muestra siempre antes de pagar.", "Tu pago queda protegido: Handticket lo retiene y solo lo libera al vendedor cuando el evento ha tenido lugar.", "La entrada se entrega en tu cuenta («Mis entradas»), con su código QR. En eventos con cambio de nombre, la entrega puede requerir la colaboración del vendedor y se te avisará por email."] },
      { h: "4. Vender entradas", p: ["Solo puedes vender entradas que hayas adquirido legítimamente, que sean válidas y que el organizador permita transmitir. Debes subir el archivo original y no puedes vender la misma entrada en más de un sitio.", "El precio de venta no puede superar el 130 % del precio original de la entrada, salvo que la normativa aplicable o el evento permitan otro límite. Handticket puede rechazar o retirar anuncios que superen esos límites o que no cumplan las condiciones del organizador.", "Publicar es gratis. Cuando la entrada se vende, Handticket cobra una comisión del 10 % sobre el precio de venta, que se descuenta del importe que recibes. Verás el importe exacto antes de publicar.", "Una vez vendida la entrada no puedes usarla, compartirla ni transferirla a terceros."] },
      { h: "5. Verificación de entradas", p: ["Para proteger a compradores y vendedores, comprobamos cada archivo que se sube (formato, código QR, duplicados y coherencia con el evento). La verificación es una ayuda y no garantiza por sí sola la admisión en el evento, pero si una entrada verificada es rechazada en el acceso por causa ajena al comprador, se aplicará la Garantía Handticket."] },
      { h: "6. Pagos y cobro del vendedor", p: ["Los pagos de los compradores se procesan a través de proveedores de pago autorizados. Handticket no almacena los datos completos de tu tarjeta.", "El vendedor cobra mediante transferencia SEPA a la cuenta que haya indicado, normalmente en los días hábiles siguientes a la celebración del evento. El vendedor es responsable de la exactitud del IBAN y del titular, y de sus obligaciones fiscales derivadas de la venta."] },
      { h: "7. Garantía Handticket", p: ["Si la entrada no es válida, está duplicada, no se corresponde con lo anunciado o el evento se cancela, tienes derecho al reembolso íntegro del importe pagado, incluidos los gastos de gestión, o a una entrada equivalente si es posible.", "Para reclamar debes avisarnos desde el Centro de ayuda lo antes posible y como máximo en las 48 horas siguientes al evento, indicando el pedido y, si procede, una prueba del rechazo en el acceso."] },
      { h: "8. Cancelación, aplazamiento y desistimiento", p: ["Si el evento se cancela, reembolsamos el importe completo. Si se aplaza, la entrada suele seguir siendo válida para la nueva fecha; si no puedes asistir, podrás revenderla.", "De acuerdo con el artículo 103.l) del Real Decreto Legislativo 1/2007 (Ley General para la Defensa de los Consumidores y Usuarios), la compra de entradas para actividades de ocio en una fecha o periodo determinado está excluida del derecho de desistimiento de 14 días."] },
      { h: "9. Conductas prohibidas", p: ["Está prohibido: publicar entradas falsas, duplicadas o robadas; manipular precios o crear anuncios engañosos; usar la plataforma para actividades ilegales; acceder a datos de otros usuarios; usar sistemas automáticos para comprar o raspar contenidos; o intentar saltarse la plataforma para evitar comisiones.", "Ante un incumplimiento podremos retirar anuncios, retener pagos mientras se investiga, cancelar operaciones y cerrar la cuenta, sin perjuicio de las acciones legales que correspondan."] },
      { h: "10. Responsabilidad", p: ["Handticket responde de la correcta prestación de sus servicios de intermediación, pago y verificación. No responde de la organización, contenido o calidad del evento, ni de las decisiones del organizador sobre admisión, aforo, horarios o cambios de programa.", "Nada de lo aquí dispuesto limita los derechos que la ley reconoce a los consumidores."] },
      { h: "11. Propiedad intelectual", p: ["La marca Handticket, el diseño y el software de la plataforma son de su titular. Los nombres y logotipos de eventos y artistas pertenecen a sus respectivos propietarios y se usan solo para identificar los eventos."] },
      { h: "12. Cambios en las condiciones", p: ["Podemos actualizar estas condiciones. Te avisaremos de los cambios relevantes y se aplicarán a las operaciones realizadas desde su publicación."] },
      { h: "13. Ley aplicable y reclamaciones", p: ["Estas condiciones se rigen por la ley española. Si eres consumidor, puedes acudir a los juzgados de tu domicilio y a la plataforma europea de resolución de litigios en línea: https://ec.europa.eu/consumers/odr.", "Para cualquier duda o reclamación escríbenos desde el Centro de ayuda."] },
    ],
  },
  {
    slug: "privacidad", n: "Política de privacidad", upd,
    intro: "Te explicamos qué datos personales tratamos, para qué, durante cuánto tiempo y qué derechos tienes, conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD.",
    secs: [
      { h: "1. Responsable del tratamiento", p: ["El responsable es el titular de Handticket identificado en el Aviso legal. Para cualquier cuestión sobre privacidad puedes contactarnos desde el Centro de ayuda."] },
      { h: "2. Datos que tratamos", p: ["Datos de cuenta: nombre, email y contraseña (guardada de forma cifrada).", "Datos de operaciones: entradas compradas y vendidas, precios, pedidos e historial.", "Datos de cobro del vendedor: titular y IBAN, solo para ingresarte el dinero de tus ventas.", "Archivos de entradas que subes para su venta, que solo se entregan al comprador cuando completa el pago.", "Datos técnicos: dirección IP, dispositivo, navegador y uso de la web, según tus preferencias de cookies."] },
      { h: "3. Para qué y con qué base legal", p: ["Ejecución del contrato: crear tu cuenta, gestionar compras y ventas, entregar entradas y pagar a los vendedores.", "Interés legítimo: prevenir el fraude, garantizar la seguridad de la plataforma y mejorar el servicio.", "Obligación legal: conservar facturas y cumplir requerimientos de autoridades.", "Consentimiento: cookies no esenciales y comunicaciones comerciales. Puedes retirarlo cuando quieras."] },
      { h: "4. Con quién compartimos datos", p: ["Con proveedores que nos prestan servicios (pagos, alojamiento, envío de emails, antifraude) bajo contrato de encargo de tratamiento. Al comprador se le muestra el nombre público del vendedor, y al vendedor lo necesario para completar la operación. No vendemos tus datos.", "Si algún proveedor está fuera del Espacio Económico Europeo, se aplican garantías adecuadas como las cláusulas contractuales tipo."] },
      { h: "5. Cuánto tiempo los conservamos", p: ["Mientras mantengas tu cuenta y, después, durante los plazos legales (por ejemplo, 6 años para datos contables y mercantiles). Los datos de navegación se conservan según la duración de cada cookie."] },
      { h: "6. Tus derechos", p: ["Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiéndonos desde el Centro de ayuda, con una prueba de tu identidad. Si no estás conforme con la respuesta, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es)."] },
      { h: "7. Seguridad", p: ["Aplicamos medidas técnicas y organizativas: cifrado en tránsito, acceso restringido, copias de seguridad y controles antifraude. Ningún sistema es infalible; si ocurriera una brecha que te afecte, te lo notificaremos conforme a la ley."] },
      { h: "8. Menores", p: ["Handticket no está dirigido a menores de 18 años y no recoge conscientemente sus datos."] },
    ],
  },
  {
    slug: "cookies", n: "Política de cookies", upd,
    intro: "Usamos cookies y tecnologías similares para que la web funcione, recordar tus preferencias y, si lo aceptas, medir el uso y personalizar el contenido.",
    secs: [
      { h: "1. Qué son las cookies", p: ["Son pequeños archivos que se guardan en tu dispositivo cuando visitas una web. Sirven para reconocerte, recordar tus ajustes y entender cómo se usa el sitio."] },
      { h: "2. Qué cookies usamos", p: ["Necesarias: mantienen tu sesión, la seguridad y tus preferencias de cookies. No requieren consentimiento.", "Preferencias: recuerdan ajustes como el idioma, la moneda o un anuncio sin terminar.", "Analíticas: nos indican qué páginas se visitan y cómo se usan, de forma agregada, para mejorar el servicio.", "Marketing: personalizan los anuncios y miden su eficacia. Solo se activan si las aceptas."] },
      { h: "3. Cómo gestionarlas", p: ["Al entrar por primera vez puedes aceptar todas, rechazar las no esenciales o personalizar. Puedes cambiar tu decisión borrando los datos del sitio en tu navegador, lo que volverá a mostrar el aviso.", "También puedes bloquearlas desde los ajustes de tu navegador (Chrome, Safari, Firefox, Edge). Ten en cuenta que bloquear las necesarias puede impedir iniciar sesión o comprar."] },
      { h: "4. Conservación", p: ["Las cookies de sesión desaparecen al cerrar el navegador. Las persistentes duran como máximo 13 meses, y tu elección de consentimiento se renueva cada 24 meses."] },
    ],
  },
  {
    slug: "aviso-legal", n: "Aviso legal", upd,
    intro: "Información general del sitio web en cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).",
    secs: [
      { h: "1. Datos del titular", p: ["Denominación: Handticket (proyecto de demostración).", "Domicilio: Zaragoza, España.", "Contacto: a través del Centro de ayuda de este sitio.", "Los datos registrales y el NIF se completarán cuando se constituya la sociedad titular."] },
      { h: "2. Objeto", p: ["Este sitio ofrece una plataforma para la compraventa de entradas entre particulares. El acceso es gratuito, sin perjuicio de los gastos de gestión y comisiones indicados en los Términos y condiciones."] },
      { h: "3. Propiedad intelectual e industrial", p: ["Los contenidos, el diseño, los textos, el código y los signos distintivos pertenecen al titular o a terceros que han autorizado su uso. Queda prohibida su reproducción o distribución sin permiso. Los nombres de eventos, artistas y recintos pertenecen a sus propietarios y se usan solo con fines identificativos."] },
      { h: "4. Responsabilidad y enlaces", p: ["El titular no garantiza la disponibilidad ininterrumpida del sitio ni se responsabiliza de los contenidos de webs de terceros enlazadas."] },
      { h: "5. Legislación y jurisdicción", p: ["Este aviso se rige por la legislación española. Para cualquier controversia, y salvo norma imperativa en contrario, serán competentes los juzgados y tribunales de Zaragoza."] },
    ],
  },
];
export const legalBy = (s?: string) => legal.find((l) => l.slug === s);
