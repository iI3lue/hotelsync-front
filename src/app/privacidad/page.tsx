import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { LegalList, LegalSection } from "@/components/LegalSections";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo trata HotelSync tus datos personales: qué recogemos, para qué, con quién los compartimos y cómo ejercer tus derechos.",
};

const UPDATED = "18 de octubre de 2026";

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Política de privacidad" }]}
        eyebrow="Legal"
        title="Política de privacidad"
        lead="Qué datos tratamos, con qué finalidades y cómo podés ejercer tus derechos."
      />

      <div className="shell pb-24">
        <div className="max-w-[72ch] space-y-12">
          <p className="text-[0.75rem] uppercase tracking-[0.2em] text-brand-navy/45 dark:text-white/40">
            Última actualización: {UPDATED}
          </p>

          <LegalSection id="responsable" title="1. Responsable del tratamiento">
            <p>
              HotelSync es el responsable del tratamiento de los datos personales que se recogen en
              esta plataforma. Podés contactarnos en{" "}
              <a href="mailto:privacidad@hotelsync.app" className="text-brand-gold underline underline-offset-2">
                privacidad@hotelsync.app
              </a>
              .
            </p>
            <p>
              Esta política complementa los{" "}
              <Link href="/terminos" className="text-brand-gold underline underline-offset-2">
                Términos y condiciones
              </Link>{" "}
              del servicio.
            </p>
          </LegalSection>

          <LegalSection id="datos" title="2. Qué datos tratamos">
            <LegalList
              items={[
                "Identificación y contacto: nombre y correo electrónico. Si ingresás con Google, también la foto de perfil y el identificador de tu cuenta.",
                "Reserva: hotel, fechas, habitación y datos asociados a la estadía.",
                "Pago: marca de la tarjeta, últimos cuatro dígitos, importe, moneda y resultado de la operación. Nunca el número completo, la fecha de vencimiento ni el código de seguridad.",
                "Uso y seguridad: registros técnicos de acceso, como fecha, eventos de la cuenta y datos necesarios para proteger el servicio.",
              ]}
            />
          </LegalSection>

          <LegalSection id="finalidades" title="3. Con qué finalidades">
            <LegalList
              items={[
                "Crear y administrar tu cuenta y autenticar tu identidad.",
                "Gestionar reservas, disponibilidad y check-in.",
                "Procesar el pago simulado, emitir comprobantes y acreditar puntos.",
                "Responder consultas y brindar soporte.",
                "Prevenir el fraude y mantener la seguridad del servicio.",
                "Cumplir obligaciones legales y contables.",
              ]}
            />
          </LegalSection>

          <LegalSection id="autorizacion" title="4. Autorización y base legal">
            <p>
              El tratamiento se basa en la autorización previa, expresa e informada que otorgás al
              crear tu cuenta y en tu consentimiento para el uso de datos personales. Dejamos
              constancia de la fecha y hora de esa aceptación, y podés registrar tu consentimiento
              desde tu cuenta.
            </p>
            <p>
              En Colombia aplicamos la Ley 1581 de 2012 y el Decreto 1377 de 2013. En Argentina
              aplicamos la Ley 25.326 de Protección de Datos Personales.
            </p>
          </LegalSection>

          <LegalSection id="cookies" title="5. Cookies y almacenamiento local">
            <LegalList
              items={[
                "Sesión: cookie de autenticación necesaria para mantener la sesión abierta.",
                "Recordarme: cookie hs_remember, que conserva tu sesión entre visitas cuando marcás esa opción.",
                "Preferencias: idioma, moneda y tema claro u oscuro.",
              ]}
            />
            <p>
              No utilizamos cookies publicitarias ni de seguimiento con fines de publicidad.
            </p>
          </LegalSection>

          <LegalSection id="compartir" title="6. Con quién compartimos">
            <LegalList
              items={[
                "Proveedor de identidad: Google, únicamente cuando elegís esa vía de acceso.",
                "Proveedores de infraestructura y hosting que operan la plataforma bajo acuerdos de confidencialidad.",
                "Autoridades competentes, cuando medie un requerimiento legal.",
              ]}
            />
            <p>No vendemos ni cedemos tus datos personales con fines comerciales.</p>
          </LegalSection>

          <LegalSection id="conservacion" title="7. Cuánto tiempo los conservamos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Los registros de reservas y
              pagos se conservan durante el plazo legal y contable aplicable. Si solicitás la
              supresión, conservamos únicamente lo que la ley exija.
            </p>
          </LegalSection>

          <LegalSection id="derechos" title="8. Tus derechos">
            <p>En cualquier momento podés ejercer los siguientes derechos:</p>
            <LegalList
              items={[
                "Conocer, actualizar y rectificar tus datos personales.",
                "Solicitar prueba de la autorización que otorgaste.",
                "Ser informado sobre el uso que damos a tus datos.",
                "Solicitar la supresión de tus datos cuando no exista un deber legal de conservarlos.",
                "Revocar la autorización y presentar quejas ante la autoridad de control.",
              ]}
            />
            <p>
              Podés eliminar tu cuenta y sus datos desde Cuenta → Perfil. La autoridad de control
              es la Superintendencia de Industria y Comercio en Colombia y la Agencia de Acceso a
              la Información Pública en Argentina.
            </p>
          </LegalSection>

          <LegalSection id="seguridad" title="9. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas razonables: la contraseña se guarda
              cifrada con hash, las sesiones usan tokens firmados y el acceso a los datos está
              restringido por rol. Ningún sistema es infalible; si ocurre un incidente que afecte
              tus datos, te lo informamos.
            </p>
          </LegalSection>

          <LegalSection id="menores" title="10. Menores de edad">
            <p>
              La plataforma está destinada a personas mayores de edad. Si viaja un menor, la
              reserva debe realizarla su representante legal.
            </p>
          </LegalSection>

          <LegalSection id="cambios" title="11. Cambios en esta política">
            <p>
              Podemos actualizar esta política para reflejar cambios del servicio o de la
              normativa. Publicamos la versión vigente en esta página con su fecha de
              actualización y, si el cambio es sustancial, lo comunicamos por correo.
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  );
}
