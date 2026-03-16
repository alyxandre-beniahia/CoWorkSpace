import { Injectable } from "@nestjs/common";
import PDFDocument = require("pdfkit");
import type { ReservationListItem } from "../../domain/entities/reservation.entity";

type UserSummary = {
  fullname: string;
  email: string;
};

type SpaceSummary = {
  name: string;
};

type Period = {
  from?: Date;
  to?: Date;
};

@Injectable()
export class ReservationPdfService {
  buildUserReservationsPdf(params: {
    user: UserSummary;
    period: Period;
    reservations: ReservationListItem[];
  }): Promise<Buffer> {
    const { user, period, reservations } = params;
    const title = "Historique de réservations";
    const subtitle = `${user.fullname} <${user.email}>`;
    return this.buildPdf({ title, subtitle, period, reservations });
  }

  buildSpaceReservationsPdf(params: {
    space: SpaceSummary;
    period: Required<Period>;
    reservations: ReservationListItem[];
  }): Promise<Buffer> {
    const { space, period, reservations } = params;
    const title = `Réservations de la salle ${space.name}`;
    const subtitle = "";
    return this.buildPdf({ title, subtitle, period, reservations });
  }

  private buildPdf(params: {
    title: string;
    subtitle?: string;
    period: Period;
    reservations: ReservationListItem[];
  }): Promise<Buffer> {
    const { title, subtitle, period, reservations } = params;

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: unknown) => chunks.push(chunk as Buffer));
      doc.on("error", (err: Error) => reject(err));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text(title, { align: "left" }).moveDown(0.5);

      if (subtitle) {
        doc.fontSize(12).text(subtitle, { align: "left" }).moveDown(0.5);
      }

      if (period.from || period.to) {
        const fromStr = period.from
          ? period.from.toLocaleDateString("fr-FR")
          : "—";
        const toStr = period.to ? period.to.toLocaleDateString("fr-FR") : "—";
        doc.fontSize(10).text(`Période : du ${fromStr} au ${toStr}`).moveDown();
      }

      if (reservations.length === 0) {
        doc
          .moveDown()
          .fontSize(12)
          .text("Aucune réservation sur cette période.", {
            align: "left",
          });
        doc.end();
        return;
      }

      const pageMargins =
        (doc.page as any).margins && typeof (doc.page as any).margins.left === "number"
          ? (doc.page as any).margins
          : { left: 40, right: 40, top: 40, bottom: 40 };

      const tableX = pageMargins.left;
      const headerY = doc.y + 10;
      const columns = [
        { label: "Date", width: 90 },
        { label: "Créneau", width: 100 },
        { label: "Espace", width: 140 },
        { label: "Poste", width: 60 },
        { label: "Titre", width: 130 },
      ] as const;

      let x = tableX;
      doc.fontSize(10).font("Helvetica-Bold");
      for (const col of columns) {
        doc.text(col.label, x, headerY, { width: col.width });
        x += col.width + 4;
      }

      doc
        .moveTo(tableX, headerY - 2)
        .lineTo(doc.page.width - pageMargins.right, headerY - 2)
        .stroke();

      doc.font("Helvetica");

      const pageBottom = doc.page.height - pageMargins.bottom;

      const sorted = [...reservations].sort(
        (a, b) => a.startDatetime.getTime() - b.startDatetime.getTime(),
      );

      for (const r of sorted) {
        if (doc.y > pageBottom - 40) {
          doc.addPage();
          // réinitialiser la position de départ du tableau sur la nouvelle page
          doc.fontSize(10).font("Helvetica-Bold");
          let newX = tableX;
          const newHeaderY = doc.y + 10;
          for (const col of columns) {
            doc.text(col.label, newX, newHeaderY, { width: col.width });
            newX += col.width + 4;
          }
          doc
            .moveTo(tableX, newHeaderY - 2)
            .lineTo(doc.page.width - pageMargins.right, newHeaderY - 2)
            .stroke();
          doc.font("Helvetica");
        }

        const dateStr = r.startDatetime.toLocaleDateString("fr-FR");
        const timeStr = `${r.startDatetime.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })} – ${r.endDatetime.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        const space = r.spaceName;
        const seat = r.seatCode ?? "";
        const titleText =
          r.isPrivate && !r.isOwner ? "(privé)" : (r.title ?? "");

        let colX = tableX;
        const rowY = doc.y + 4;

        doc.text(dateStr, colX, rowY, { width: columns[0].width });
        colX += columns[0].width + 4;

        doc.text(timeStr, colX, rowY, { width: columns[1].width });
        colX += columns[1].width + 4;

        doc.text(space, colX, rowY, { width: columns[2].width });
        colX += columns[2].width + 4;

        doc.text(seat, colX, rowY, { width: columns[3].width });
        colX += columns[3].width + 4;

        doc.text(titleText, colX, rowY, { width: columns[4].width });

        doc.moveDown(1.2);
      }

      doc.end();
    });
  }
}
