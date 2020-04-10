import { Router, Response, Request, NextFunction, ErrorRequestHandler } from "express";
import { createConnection, DeleteResult, Repository, Connection, UpdateResult, getConnection } from "typeorm";
import { ormconfig } from "../../config";
import { Controller } from "../Controller";
import { Distress } from '../../entities/Distress';
import Utils from "../SendEmail"
export default class ConfirmationController extends Controller {

    distressRepository : Repository<Distress>
    constructor() {
        super()
        this.createConnectionAndAssignRepository().then(async (_) => {
            await this.addAllRoutes(this.mainRouter);
        })
    }
    async createConnectionAndAssignRepository(): Promise<void> {
        try {
            var connection: Connection = await createConnection(ormconfig)
            this.distressRepository = connection.getRepository(Distress)
        } catch (error) {
            console.log(error)
        }

    }

    async addPost(router: Router): Promise<void> {
        await this.postConfirmation(router)
    }

    async addDelete(router: Router): Promise<void> {
    }

    async addGet(router: Router): Promise<void> {
    }


    async addPut(router: Router): Promise<void> {
    }
    async postConfirmation(router: Router) {
        router.post("/:email/:code", async (req: Request, res: Response, next: NextFunction) => {
            try {
                var u = await this.distressRepository.findOneOrFail({where: {emailUser: req.params.email}})
                if(u.codeDist != req.params.code)
                    throw new Error("Code fail")
                await this.sendResponse(res, 200, { message: "Account confirmed" })
            } catch (error) {
                await this.sendResponse(res, 401, { message: "Code error", error: error })
            }
            next()
        })
        router.post("/:email/send", async (req: Request, res: Response, next: NextFunction) => {
            try {
                var u = await this.distressRepository.findOneOrFail({where: {emailUser: req.params.email}})
                Utils.sendEmail(req.params.email, u.codeDist);
                this.sendResponse(res, 201, { message: "Confirmation Successfully" })
            } catch (error) {
                await this.sendResponse(res, 403, { message: "Error", error: error })
            }
            next()
        })
        router.post("/:email/refresh", async (req: Request, res: Response, next: NextFunction) => {
            try {
                var u = await this.distressRepository.findOneOrFail({where: {emailUser: req.params.email}})
                u.codeDist = Math.floor(Math.random() * (9999999 - 100000) + 100000).toString()
                await this.distressRepository.save(u)
                Utils.sendEmail(req.params.email, u.codeDist)
                await this.sendResponse(res, 201, { message: "Confirmation Successfully" })
            } catch (error) {
                await this.sendResponse(res, 403, { message: "User not found", error: error })
            }
            next()
        })
    }


}