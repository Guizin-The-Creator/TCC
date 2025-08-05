-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tcc` DEFAULT CHARACTER SET utf8mb4 ;
-- -----------------------------------------------------
-- Schema sistemagestao
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema sistemagestao
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sistemagestao` ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`conta`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`conta` (
  `idconta` INT(11) NOT NULL,
  `usuarios_idUsuario` INT(11) NOT NULL,
  `pioridade` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idconta`, `usuarios_idUsuario`),
  INDEX `fk_conta_usuarios_idx` (`usuarios_idUsuario` ASC),
  CONSTRAINT `fk_conta_usuarios`
    FOREIGN KEY (`usuarios_idUsuario`)
    REFERENCES `sistemagestao`.`usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

USE `tcc` ;

-- -----------------------------------------------------
-- Table `tcc`.`cargos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`cargos` (
  `idCargo` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeCargo` VARCHAR(45) NULL DEFAULT NULL,
  `prioridadeCargo` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idCargo`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`usuarios` (
  `idUsuario` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeUsuario` VARCHAR(45) NULL DEFAULT NULL,
  `emailUsuario` VARCHAR(45) NULL DEFAULT NULL,
  `senhaUsuario` VARCHAR(45) NULL DEFAULT NULL,
  `dataCadastro` DATETIME NULL DEFAULT NULL,
  `idCargo` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  INDEX `idCargo` (`idCargo` ASC),
  CONSTRAINT `fk_usuarios_cargos`
    FOREIGN KEY (`idCargo`)
    REFERENCES `tcc`.`cargos` (`idCargo`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`conta`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`conta` (
  `idconta` INT(11) NOT NULL,
  `usuarios_idUsuario` INT(11) NOT NULL,
  `pioridade` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idconta`, `usuarios_idUsuario`),
  INDEX `usuarios_idUsuario` (`usuarios_idUsuario` ASC),
  CONSTRAINT `fk_conta_usuarios`
    FOREIGN KEY (`usuarios_idUsuario`)
    REFERENCES `tcc`.`usuarios` (`idUsuario`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`lancamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`lancamentos` (
  `idConta` INT(11) NOT NULL,
  `datavenc` DATE NULL DEFAULT NULL,
  `categoria` VARCHAR(45) NULL DEFAULT NULL,
  `subcategoria` VARCHAR(45) NULL DEFAULT NULL,
  `valorlancamento` DECIMAL(10,2) NULL DEFAULT NULL,
  `classificacao` VARCHAR(45) NULL DEFAULT NULL,
  `datapgto` DATE NULL DEFAULT NULL,
  `status` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idConta`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`produtos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`produtos` (
  `idProduto` INT(11) NOT NULL,
  `nomeProduto` VARCHAR(45) NULL DEFAULT NULL,
  `segmentoProduto` VARCHAR(45) NULL DEFAULT NULL,
  `subsegmentoProduto` VARCHAR(45) NULL DEFAULT NULL,
  `custoProduto` DECIMAL(10,2) NULL DEFAULT NULL,
  PRIMARY KEY (`idProduto`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`tarefas` (
  `idTarefa` INT(11) NOT NULL AUTO_INCREMENT,
  `tituloTarefa` VARCHAR(45) NULL DEFAULT NULL,
  `descricaoTarefa` TEXT NULL DEFAULT NULL,
  `statusTarefa` VARCHAR(45) NULL DEFAULT NULL,
  `dataInicio` DATE NULL DEFAULT NULL,
  `dataFim` DATE NULL DEFAULT NULL,
  `valorOpc` DECIMAL(10,2) NULL DEFAULT NULL,
  PRIMARY KEY (`idTarefa`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`extratos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`extratos` (
  `idExtrato` INT(11) NOT NULL,
  `tipoExtrato` VARCHAR(45) NULL DEFAULT NULL,
  `categoriaExtrato` VARCHAR(255) NULL DEFAULT NULL,
  `valorExtrato` DECIMAL(10,2) NULL DEFAULT NULL,
  `dataExtrato` DATE NULL DEFAULT NULL,
  `subcategoriaExtrato` VARCHAR(45) NULL DEFAULT NULL,
  `produtos_idProduto` INT(11) NULL DEFAULT NULL,
  `contas_idConta` INT(11) NOT NULL,
  `tarefas_idTarefa` INT(11) NOT NULL,
  PRIMARY KEY (`idExtrato`, `contas_idConta`, `tarefas_idTarefa`),
  INDEX `produtos_idProduto` (`produtos_idProduto` ASC),
  INDEX `contas_idConta` (`contas_idConta` ASC),
  INDEX `tarefas_idTarefa` (`tarefas_idTarefa` ASC),
  CONSTRAINT `fk_extratos_contas1`
    FOREIGN KEY (`contas_idConta`)
    REFERENCES `tcc`.`lancamentos` (`idConta`),
  CONSTRAINT `fk_extratos_produtos1`
    FOREIGN KEY (`produtos_idProduto`)
    REFERENCES `tcc`.`produtos` (`idProduto`),
  CONSTRAINT `fk_extratos_tarefas1`
    FOREIGN KEY (`tarefas_idTarefa`)
    REFERENCES `tcc`.`tarefas` (`idTarefa`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`metas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`metas` (
  `idMeta` INT(11) NOT NULL,
  `categoriaMeta` VARCHAR(45) NULL DEFAULT NULL,
  `orcamentoMeta` DECIMAL(10,2) NULL DEFAULT NULL,
  `gastoMeta` DATE NULL DEFAULT NULL,
  `conta_idconta` INT(11) NOT NULL,
  PRIMARY KEY (`idMeta`),
  INDEX `conta_idconta` (`conta_idconta` ASC),
  CONSTRAINT `fk_metas_conta1`
    FOREIGN KEY (`conta_idconta`)
    REFERENCES `tcc`.`conta` (`idconta`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`rentabilidades`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`rentabilidades` (
  `idRentabilidade` INT(11) NOT NULL,
  `segmento` VARCHAR(45) NULL DEFAULT NULL,
  `subsegmento` VARCHAR(45) NULL DEFAULT NULL,
  `comparativotaxa` DECIMAL(10,2) NULL DEFAULT NULL,
  `comparativonome` VARCHAR(45) NULL DEFAULT NULL,
  `conta_idconta` INT(11) NOT NULL,
  PRIMARY KEY (`idRentabilidade`),
  INDEX `conta_idconta` (`conta_idconta` ASC),
  CONSTRAINT `fk_rentabilidades_conta1`
    FOREIGN KEY (`conta_idconta`)
    REFERENCES `tcc`.`conta` (`idconta`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tcc`.`usuarios_tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tcc`.`usuarios_tarefas` (
  `idUsuario` INT(11) NOT NULL,
  `idTarefa` INT(11) NOT NULL,
  PRIMARY KEY (`idUsuario`, `idTarefa`),
  INDEX `idTarefa` (`idTarefa` ASC),
  CONSTRAINT `fk_usuarios_tarefas_tarefa`
    FOREIGN KEY (`idTarefa`)
    REFERENCES `tcc`.`tarefas` (`idTarefa`),
  CONSTRAINT `fk_usuarios_tarefas_usuario`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `tcc`.`usuarios` (`idUsuario`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

USE `sistemagestao` ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
