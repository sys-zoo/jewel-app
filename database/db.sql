CREATE DATABASE FTE_BANGALORE_DB;
USE FTE_BANGALORE_DB;

DROP TABLE IF EXISTS `FTE_BANG_DATA`;

CREATE TABLE `FTE_BANG_DATA` (
   id bigint(8) UNSIGNED AUTO_INCREMENT PRIMARY KEY not null,
  `fname` varchar(255) DEFAULT NULL,
  `mobile` varchar(25) DEFAULT NULL,
  `CName` varchar(255) DEFAULT NULL,
  `Nationality` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ladd` varchar(255) DEFAULT NULL,
  `padd` varchar(255) DEFAULT NULL,
  `dob` varchar(20) DEFAULT NULL,
  `State` varchar(255) DEFAULT 'Karnataka',
  `altno` varchar(25) DEFAULT NULL,
  `Gender` varchar(255) DEFAULT NULL,
  `Ctype` varchar(255) DEFAULT NULL,
  `adr` varchar(255) DEFAULT NULL,
  `uid` varchar(255) DEFAULT NULL,
  `DOA` varchar(255) DEFAULT NULL,
  FULLTEXT KEY `idx_dob` (`dob`),
  FULLTEXT KEY `idx_adr` (`adr`),
  FULLTEXT KEY `idx_uid` (`uid`),
  FULLTEXT KEY `idx_fname` (`fname`),
  FULLTEXT KEY `idx_cname` (`CName`),
  FULLTEXT KEY `idx_mobile` (`mobile`),
  FULLTEXT KEY `idx_altno` (`altno`),
  FULLTEXT KEY `idx_ladd` (`ladd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE INDEX idx_dob_1 ON FTE_BANG_DATA(dob); 
CREATE INDEX idx_adr_1 ON FTE_BANG_DATA(adr); 
CREATE INDEX idx_uid_1 ON FTE_BANG_DATA(uid); 
CREATE INDEX idx_fname_1 ON FTE_BANG_DATA(fname); 
CREATE INDEX idx_cname_1 ON FTE_BANG_DATA(CName); 
CREATE INDEX idx_mobile_1 ON FTE_BANG_DATA(mobile); 
CREATE INDEX idx_altno_1 ON FTE_BANG_DATA(altno); 
CREATE INDEX idx_ladd_1 ON FTE_BANG_DATA(ladd); 

DROP TABLE IF EXISTS `FTE_COPY_DATA_STATUS`;
CREATE TABLE `FTE_COPY_DATA_STATUS` (
   id bigint UNSIGNED,
   created_On TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   status tinyint(1) default 0
);

drop procedure if exists SP_FTE_COPY_DATA;
DELIMITER $$
CREATE PROCEDURE SP_FTE_COPY_DATA()   
BEGIN
DECLARE idx INT DEFAULT 0; 
DECLARE status_idx INT DEFAULT 0; 
DECLARE total_count INT DEFAULT 0; 
WHILE (idx <=  70349671) DO
	select count(*) into total_count from FTE_BANG_DATA;
	select id into status_idx from FTE_COPY_DATA_STATUS where status=0;
	set idx = total_count;
	INSERT INTO FTE_COPY_DATA_STATUS(id)  VALUES(idx);
    insert into FTE_BANG_DATA(fname,mobile,CName,Nationality,email,ladd,padd,dob,State,altno,Gender,Ctype,adr,uid,DOA) select 
	fname,CONVERT(aes_decrypt(from_base64(mobile),'MyNicotex@1') USING utf8) as mobile,CName,Nationality,email,ladd,padd,dob,State,altno,Gender,Ctype,adr,uid,DOA
	from bang_data.bdata_22 limit idx, 100000;
    commit;
	UPDATE FTE_COPY_DATA_STATUS SET updated_on = CURRENT_TIMESTAMP, status=1 WHERE id = idx;
	commit;
	if total_count <> 0 THEN
	 set idx = status_idx;
	end if;
	SET idx = idx+100000;
END WHILE;
END$$
DELIMITER ;

-- Copy 
CALL SP_FTE_COPY_DATA();

-- Monitoring
select *, TIMESTAMPDIFF(MINUTE,created_on, updated_on) as minutes from FTE_COPY_DATA_STATUS;

-- Monitoring
select *, TIMESTAMPDIFF(MINUTE,created_on, now()) as min, TIMESTAMPDIFF(SECOND,created_on, now()) as sec from FTE_COPY_DATA_STATUS where status=0;

--% Complete status

select concat(round((id/700000),2),'%') as complete_status from FTE_COPY_DATA_STATUS where status=0;
