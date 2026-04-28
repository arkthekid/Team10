import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { getUserId } from "../utils/getUserId";
import * as reportService from "../services/reportService";

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reporterId = getUserId(req);
    const result = await reportService.createReport(reporterId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reports = await reportService.getReports();
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Report id is required", 400));
    }

    const report = await reportService.getReportById(id);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (
  req: Request<
    { id: string },
    {},
    { status: "pending" | "reviewed" | "resolved"; adminNotes?: string | null }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = getUserId(req);
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Report id is required", 400));
    }

    const updated = await reportService.updateReportStatus(id, adminId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};