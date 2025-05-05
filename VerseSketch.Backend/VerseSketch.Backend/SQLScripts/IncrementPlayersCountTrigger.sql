create or replace function IncrementPlayersCount()
returns trigger as
$$
begin
	if (TG_OP='INSERT' or TG_OP='UPDATE') then
		update "Rooms" set "PlayersCount"="PlayersCount"+1 where "Rooms"."Title"=new."RoomTitle";
	end if;
	if (TG_OP='DELETE') then
		update "Rooms" set "PlayersCount"="PlayersCount"-1 where "Rooms"."Title"=old."RoomTitle";
	end if;
	return null;
end;
$$
language plpgsql;

create or replace trigger OnPlayerAdd
	after insert or delete or update of "RoomTitle" on "Players"
		for each row
			execute function IncrementPlayersCount();

-- insert into "Players" ("Id","Nickname","RoomTitle") values ('sjkhdgf','adminn','cool room');