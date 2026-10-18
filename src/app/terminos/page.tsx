import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { LegalList, LegalSection } from "@/components/LegalSections";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones de uso de HotelSync: cuentas, reservas, pagos, cancelaciones y programa de puntos.",
};

const UPDATED = "18 de octubre de 2026";

export default function TermsPage() {
  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Términos y condiciones" }]}
        eyebrow="Legal"
        title="Términos y condiciones"
        lead="Las reglas que rigen el uso de HotelSync, las reservas y el programa de puntos."
      />

      <div className="shell pb-24">
        <div className="max-w-[72ch] space-y-12">
          <p className="text-[0.75rem] uppercase tracking-[0.2em] text-brand-navy/45 dark:text-white/40">
            Última actualización: {UPDATED}
          </p>

          <LegalSection id="aceptacion" title="1. Aceptación">
            <p>
              HotelSync es la plataforma de reservas directas de la cadena. Al crear una
              cuenta, aceptar el tratamiento de tus datos o completar una reserva, confirmás
              que leíste y aceptás estos términos y la{" "}
              <Link href="/privacidad" className="text-brand-gold underline underline-offset-2">
                Política de privacidad
              </Link>
              .
            </p>
            <p>
              El registro exige la aceptación expresa de estos términos y queda registrado con
              fecha y hora en tu cuenta.
            </p>
          </LegalSection>

          <LegalSection id="servicio" title="2. Descripción del servicio">
            <p>
              Ofrecemos un buscador y motor de reservas para las propiedades de la cadena, junto
              con la gestión de tu cuenta: historial de reservas, pago, programa de puntos y
              check-in en recepción.
            </p>
            <p>
              La reserva se cierra contra la disponibilidad real del hotel en el momento de
              confirmar. Cada propiedad se reserva el derecho de admisión.
            </p>
          </LegalSection>

          <LegalSection id="cuenta" title="3. Tu cuenta">
            <p>
              Para reservar necesitás una cuenta. Podés crearla con tu correo y una contraseña, o
              ingresar con tu cuenta de Google.
            </p>
            <p>
              Tu correo electrónico identifica la cuenta y es el canal de las notificaciones
              transaccionales de tus reservas.
            </p>
            <p>
              Debés mantener la confidencialidad de tus credenciales y avisarnos ante cualquier uso
              no autorizado. Sos responsable de la actividad realizada desde tu cuenta.
            </p>
          </LegalSection>

          <LegalSection id="reservas" title="4. Reservas y disponibilidad">
            <LegalList
              items={[
                "Al confirmar recibís un código de reserva y un correo de confirmación.",
                "El pago con tarjeta confirma la reserva de inmediato. La opción de pago en el hotel mantiene la reserva pendiente hasta el check-in.",
                "Las condiciones particulares de cada tarifa (anticipación, mínimos de estadía, restricciones) se informan antes de confirmar y forman parte del contrato.",
                "La disponibilidad se garantiza únicamente una vez confirmada la reserva.",
              ]}
            />
          </LegalSection>

          <LegalSection id="pagos" title="5. Precios y pagos">
            <p>
              Los precios se expresan en la moneda de la propiedad e incluyen los impuestos
              aplicables, salvo que se indique lo contrario.
            </p>
            <p>
              En este entorno la pasarela de pago es una simulación: no se procesan cobros reales
              y no se captura, almacena ni transmite el número completo de tu tarjeta. Solo se
              conservan los últimos cuatro dígitos, la marca, el importe y el resultado de la
              operación, a modo de trazabilidad contable.
            </p>
            <p>
              Si elegís pagar en el hotel, el saldo se liquida en recepción al momento del
              check-in.
            </p>
          </LegalSection>

          <LegalSection id="cancelaciones" title="6. Cancelaciones, cambios y reembolsos">
            <LegalList
              items={[
                "Podés cancelar una reserva desde Mis reservas.",
                "Las penalidades y los plazos dependen de la tarifa contratada y se muestran al confirmar.",
                "Cuando la tarifa lo permite, el reembolso se acredita al medio de pago con el que abonaste el anticipo.",
                "La cancelación de una reserva paga revierte los puntos acreditados por esa estadía.",
              ]}
            />
          </LegalSection>

          <LegalSection id="puntos" title="7. Programa de puntos">
            <p>
              Acreditamos puntos en tu cuenta por cada reserva paga, en función del importe de la
              estadía. Podés aplicarlos como canje al pagar una reserva: se consumen hasta el
              límite de tu saldo disponible.
            </p>
            <p>
              Al cancelar o reembolsar una reserva se revierten los puntos de esa operación. Los
              puntos no son transferibles y no tienen valor fuera de la plataforma.
            </p>
          </LegalSection>

          <LegalSection id="uso-aceptable" title="8. Uso aceptable">
            <LegalList
              items={[
                "No usar la plataforma con fines ilícitos ni fraudulentos.",
                "No automatizar consultas que degraden el servicio para el resto de las personas.",
                "No suplantar identidades ni compartir tus credenciales.",
                "No intentar acceder a información de otras personas o a áreas restringidas del sistema.",
              ]}
            />
          </LegalSection>

          <LegalSection id="propiedad" title="9. Propiedad intelectual">
            <p>
              La marca, los textos, las fotografías, el diseño y el código de la plataforma
              pertenecen a la cadena o a sus licenciantes. El uso del servicio no transfiere
              ningún derecho sobre ellos.
            </p>
          </LegalSection>

          <LegalSection id="responsabilidad" title="10. Disponibilidad y responsabilidad">
            <p>
              Trabajamos para mantener el servicio disponible, pero puede interrumpirse por
              mantenimiento, fallas de terceros o causas ajenas a nuestro control. No respondemos
              por daños indirectos derivados de esas interrupciones.
            </p>
            <p>
              Cuando una reserva no pueda cumplirse por causa del hotel, ofrecemos una alternativa
              equivalente o el reembolso del importe abonado.
            </p>
          </LegalSection>

          <LegalSection id="cambios" title="11. Cambios en estos términos">
            <p>
              Podemos actualizar estos términos para reflejar cambios del servicio o de la
              normativa. Publicamos la versión vigente en esta página con su fecha de
              actualización y, si el cambio es sustancial, lo comunicamos por correo.
            </p>
          </LegalSection>

          <LegalSection id="ley" title="12. Ley aplicable y contacto">
            <p>
              Rigen las leyes de la República de Colombia y de la República Argentina según la
              propiedad de la reserva. Para consultas sobre estos términos escribinos a{" "}
              <a href="mailto:contacto@hotelsync.app" className="text-brand-gold underline underline-offset-2">
                contacto@hotelsync.app
              </a>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  );
}
